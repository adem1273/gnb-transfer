import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable menu item component
const SortableMenuItem = ({ item, index, onRemove, onUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-white border rounded-lg mb-2"
    >
      <div {...attributes} {...listeners} className="cursor-move p-2 text-gray-400 hover:text-gray-600">
        ⋮⋮
      </div>
      <div className="flex-1">
        <div className="font-medium">{item.label}</div>
        <div className="text-sm text-gray-500">
          {item.pageSlug ? `Page: ${item.pageSlug}` : `URL: ${item.externalUrl}`}
        </div>
      </div>
      <div className="text-sm text-gray-400">Order: {index}</div>
      <button
        onClick={() => onRemove(item.id)}
        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
      >
        Remove
      </button>
    </div>
  );
};

const MenuManager = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [menus, setMenus] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: 'header',
    isActive: true,
    items: [],
  });
  
  // New item form state
  const [newItem, setNewItem] = useState({
    label: '',
    pageSlug: '',
    externalUrl: '',
    linkType: 'page', // 'page' or 'external'
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchMenus();
    fetchPages();
  }, []);

  const fetchMenus = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/admin/menus`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setMenus(result.data.menus);
      } else {
        setError(result.message || 'Failed to fetch menus');
      }
    } catch (err) {
      setError('Network error while fetching menus');
      console.error('Fetch menus error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/admin/pages?published=true&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setPages(result.data.pages || []);
      }
    } catch (err) {
      console.error('Fetch pages error:', err);
    }
  };

  const handleCreateMenu = () => {
    setEditingMenu(null);
    setFormData({
      name: '',
      location: 'header',
      isActive: true,
      items: [],
    });
    setShowCreateModal(true);
  };

  const handleEditMenu = (menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      location: menu.location,
      isActive: menu.isActive,
      items: menu.items.map((item, index) => ({
        ...item,
        id: `item-${index}`,
      })),
    });
    setShowCreateModal(true);
  };

  const handleAddItem = () => {
    if (!newItem.label) {
      setError('Please enter a label for the menu item');
      return;
    }

    if (newItem.linkType === 'page' && !newItem.pageSlug) {
      setError('Please select a page');
      return;
    }

    if (newItem.linkType === 'external' && !newItem.externalUrl) {
      setError('Please enter an external URL');
      return;
    }

    const item = {
      id: `item-${Date.now()}`,
      label: newItem.label,
      order: formData.items.length,
    };

    if (newItem.linkType === 'page') {
      item.pageSlug = newItem.pageSlug;
    } else {
      item.externalUrl = newItem.externalUrl;
    }

    setFormData({
      ...formData,
      items: [...formData.items, item],
    });

    setNewItem({
      label: '',
      pageSlug: '',
      externalUrl: '',
      linkType: 'page',
    });
    setError('');
  };

  const handleRemoveItem = (itemId) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== itemId),
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.items.findIndex((item) => item.id === active.id);
        const newIndex = prev.items.findIndex((item) => item.id === over.id);
        
        return {
          ...prev,
          items: arrayMove(prev.items, oldIndex, newIndex),
        };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.location) {
      setError('Name and location are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const menuData = {
        name: formData.name,
        location: formData.location,
        isActive: formData.isActive,
        items: formData.items.map((item, index) => {
          const menuItem = {
            label: item.label,
            order: index,
          };
          if (item.pageSlug) {
            menuItem.pageSlug = item.pageSlug;
          } else if (item.externalUrl) {
            menuItem.externalUrl = item.externalUrl;
          }
          return menuItem;
        }),
      };

      const url = editingMenu
        ? `${import.meta.env.VITE_API_URL || '/api'}/admin/menus/${editingMenu._id}`
        : `${import.meta.env.VITE_API_URL || '/api'}/admin/menus`;

      const method = editingMenu ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(menuData),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(editingMenu ? 'Menu updated successfully' : 'Menu created successfully');
        setShowCreateModal(false);
        fetchMenus();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to save menu');
      }
    } catch (err) {
      setError('Network error while saving menu');
      console.error('Save menu error:', err);
    }
  };

  const handleDeleteMenu = async (menuId) => {
    if (!window.confirm('Are you sure you want to delete this menu?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/admin/menus/${menuId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setSuccess('Menu deleted successfully');
        fetchMenus();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to delete menu');
      }
    } catch (err) {
      setError('Network error while deleting menu');
      console.error('Delete menu error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menu Manager</h1>
        {isAdmin && (
          <button
            onClick={handleCreateMenu}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Menu
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Menus List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menus.map((menu) => (
          <div key={menu._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{menu.name}</h3>
                <p className="text-sm text-gray-500">
                  Location: <span className="font-medium">{menu.location}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Status:{' '}
                  <span className={menu.isActive ? 'text-green-600' : 'text-red-600'}>
                    {menu.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditMenu(menu)}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMenu(menu._id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Menu Items ({menu.items.length}):</p>
              <ul className="space-y-1">
                {menu.items.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {index + 1}. {item.label} →{' '}
                    {item.pageSlug ? (
                      <span className="text-blue-600">/pages/{item.pageSlug}</span>
                    ) : (
                      <span className="text-purple-600">{item.externalUrl}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {menus.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No menus found. Create your first menu to get started.
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingMenu ? 'Edit Menu' : 'Create Menu'}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Basic Info */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Menu Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Main Navigation"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="header">Header</option>
                    <option value="footer">Footer</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>

                {/* Menu Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Menu Items</h3>
                  
                  {/* Add New Item Form */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Label</label>
                        <input
                          type="text"
                          value={newItem.label}
                          onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                          className="w-full p-2 border rounded"
                          placeholder="Home"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Link Type</label>
                        <select
                          value={newItem.linkType}
                          onChange={(e) => setNewItem({ ...newItem, linkType: e.target.value, pageSlug: '', externalUrl: '' })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="page">Internal Page</option>
                          <option value="external">External URL</option>
                        </select>
                      </div>
                    </div>

                    {newItem.linkType === 'page' ? (
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Page</label>
                        <select
                          value={newItem.pageSlug}
                          onChange={(e) => setNewItem({ ...newItem, pageSlug: e.target.value })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select a page...</option>
                          {pages.map((page) => (
                            <option key={page._id} value={page.slug}>
                              {page.title} ({page.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">External URL</label>
                        <input
                          type="url"
                          value={newItem.externalUrl}
                          onChange={(e) => setNewItem({ ...newItem, externalUrl: e.target.value })}
                          className="w-full p-2 border rounded"
                          placeholder="https://example.com"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add Item
                    </button>
                  </div>

                  {/* Sortable Items List */}
                  {formData.items.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Drag items to reorder them
                      </p>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={formData.items.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {formData.items.map((item, index) => (
                            <SortableMenuItem
                              key={item.id}
                              item={item}
                              index={index}
                              onRemove={handleRemoveItem}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingMenu ? 'Update Menu' : 'Create Menu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
