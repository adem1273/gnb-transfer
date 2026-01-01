import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ui/ConfirmModal';

// Sortable section component
const SortableSection = ({ section, index, onRemove, onUpdate, onToggleActive }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 p-4 border rounded-lg mb-3 ${
        section.isActive === false ? 'bg-gray-50 opacity-60' : 'bg-white'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move p-2 text-gray-400 hover:text-gray-600 mt-2"
      >
        ⋮⋮
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-medium text-lg">{section.type}</span>
            <span className="ml-2 text-sm text-gray-500">Order: {index}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={section.isActive !== false}
                onChange={(e) => onToggleActive(section.id, e.target.checked)}
                className="rounded"
              />
              <span>Active</span>
            </label>
            <button
              onClick={() => onUpdate(section.id)}
              className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onRemove(section.id)}
              className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
            >
              Remove
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <pre className="bg-gray-50 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
            {JSON.stringify(section.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

// Section editor modal
const SectionEditorModal = ({ section, onSave, onCancel }) => {
  const [data, setData] = useState(JSON.stringify(section?.data || {}, null, 2));
  const [error, setError] = useState('');

  const handleSave = () => {
    try {
      const parsed = JSON.parse(data);
      onSave({ ...section, data: parsed });
      setError('');
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Edit Section: {section.type}</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Section Data (JSON)</label>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full border rounded p-2 font-mono text-sm h-64"
            placeholder='{"key": "value"}'
          />
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const HomeLayoutBuilder = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [layouts, setLayouts] = useState([]);
  const [currentLayout, setCurrentLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sections: [],
    seo: {
      title: '',
      description: '',
      keywords: [],
    },
  });

  // New section form state
  const [newSection, setNewSection] = useState({
    type: 'hero',
    data: {},
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/home-layouts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch layouts');
      }

      setLayouts(result.data.layouts);

      // Load active layout by default
      const activeLayout = result.data.layouts.find((l) => l.isActive);
      if (activeLayout) {
        loadLayout(activeLayout._id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLayout = async (layoutId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/admin/home-layouts/${layoutId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load layout');
      }

      setCurrentLayout(result.data);
      setFormData({
        name: result.data.name,
        description: result.data.description || '',
        sections: result.data.sections.map((s, i) => ({ ...s, id: `section-${i}` })),
        seo: result.data.seo || { title: '', description: '', keywords: [] },
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateLayout = async () => {
    if (!formData.name) {
      setError('Layout name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const sections = formData.sections.map((s, i) => ({
        type: s.type,
        data: s.data,
        order: i,
        isActive: s.isActive !== false,
      }));

      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/home-layouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          sections,
          seo: formData.seo,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create layout');
      }

      setSuccess('Layout created successfully');
      setShowCreateModal(false);
      fetchLayouts();
      setFormData({
        name: '',
        description: '',
        sections: [],
        seo: { title: '', description: '', keywords: [] },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLayout = async () => {
    if (!currentLayout) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const sections = formData.sections.map((s, i) => ({
        type: s.type,
        data: s.data,
        order: i,
        isActive: s.isActive !== false,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/admin/home-layouts/${currentLayout._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            sections,
            seo: formData.seo,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update layout');
      }

      setSuccess('Layout updated successfully');
      fetchLayouts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateLayout = async (layoutId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/admin/home-layouts/${layoutId}/activate`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to activate layout');
      }

      setSuccess('Layout activated successfully');
      fetchLayouts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initiateDeleteLayout = (layoutId) => {
    setLayoutToDelete(layoutId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteLayout = async () => {
    if (!layoutToDelete) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/admin/home-layouts/${layoutToDelete}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete layout');
      }

      setSuccess('Layout deleted successfully');
      if (currentLayout?._id === layoutToDelete) {
        setCurrentLayout(null);
        setFormData({
          name: '',
          description: '',
          sections: [],
          seo: { title: '', description: '', keywords: [] },
        });
      }
      fetchLayouts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setFormData((prev) => {
      const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
      const newIndex = prev.sections.findIndex((s) => s.id === over.id);

      return {
        ...prev,
        sections: arrayMove(prev.sections, oldIndex, newIndex),
      };
    });
  };

  const addSection = () => {
    if (!newSection.type) {
      setError('Section type is required');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `section-${Date.now()}`,
          type: newSection.type,
          data: newSection.data,
          isActive: true,
        },
      ],
    }));

    setNewSection({ type: 'hero', data: {} });
    setError('');
  };

  const removeSection = (sectionId) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
  };

  const updateSection = (sectionId, updatedSection) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? updatedSection : s)),
    }));
    setEditingSection(null);
  };

  const toggleSectionActive = (sectionId, isActive) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, isActive } : s)),
    }));
  };

  const sectionTypes = [
    { value: 'hero', label: 'Hero Banner' },
    { value: 'features', label: 'Features' },
    { value: 'tours', label: 'Tours Listing' },
    { value: 'testimonials', label: 'Testimonials' },
    { value: 'cta', label: 'Call to Action' },
    { value: 'stats', label: 'Statistics' },
    { value: 'gallery', label: 'Image Gallery' },
    { value: 'text', label: 'Text Content' },
    { value: 'faq', label: 'FAQ' },
  ];

  if (loading && layouts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Homepage Layout Builder</h1>
        <p className="text-gray-600">Create and manage dynamic homepage layouts</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-4">
          {success}
        </div>
      )}

      {/* Layout Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Layouts</h2>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create New Layout
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {layouts.map((layout) => (
            <div
              key={layout._id}
              className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition ${
                currentLayout?._id === layout._id ? 'border-blue-600 bg-blue-50' : ''
              }`}
              onClick={() => loadLayout(layout._id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{layout.name}</h3>
                  <p className="text-sm text-gray-500">{layout.sections.length} sections</p>
                </div>
                {layout.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Active
                  </span>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-2 mt-3">
                  {!layout.isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateLayout(layout._id);
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      initiateDeleteLayout(layout._id);
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Layout Editor */}
      {currentLayout && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Editing: {formData.name}
            {currentLayout.isActive && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                Active
              </span>
            )}
          </h2>

          {/* Basic Info */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Layout Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  disabled={!isAdmin}
                />
              </div>
            </div>

            {/* SEO */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">SEO Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">SEO Title</label>
                  <input
                    type="text"
                    value={formData.seo.title}
                    onChange={(e) =>
                      setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })
                    }
                    className="w-full border rounded px-3 py-2"
                    maxLength={60}
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SEO Description</label>
                  <input
                    type="text"
                    value={formData.seo.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seo: { ...formData.seo, description: e.target.value },
                      })
                    }
                    className="w-full border rounded px-3 py-2"
                    maxLength={160}
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add Section */}
          {isAdmin && (
            <div className="border-t pt-6 mb-6">
              <h3 className="font-medium mb-3">Add New Section</h3>
              <div className="flex gap-2">
                <select
                  value={newSection.type}
                  onChange={(e) => setNewSection({ ...newSection, type: e.target.value })}
                  className="border rounded px-3 py-2"
                >
                  {sectionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addSection}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  + Add Section
                </button>
              </div>
            </div>
          )}

          {/* Sections List with Drag & Drop */}
          <div className="border-t pt-6">
            <h3 className="font-medium mb-3">Sections ({formData.sections.length})</h3>

            {formData.sections.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No sections yet. Add your first section above.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={formData.sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {formData.sections.map((section, index) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      index={index}
                      onRemove={removeSection}
                      onUpdate={(id) => setEditingSection(section)}
                      onToggleActive={toggleSectionActive}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Save Button */}
          {isAdmin && (
            <div className="border-t pt-6 mt-6">
              <button
                onClick={handleUpdateLayout}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Layout'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Create New Layout</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Layout Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., Summer 2024 Homepage"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Optional description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    name: '',
                    description: '',
                    sections: [],
                    seo: { title: '', description: '', keywords: [] },
                  });
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLayout}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Editor Modal */}
      {editingSection && (
        <SectionEditorModal
          section={editingSection}
          onSave={updateSection}
          onCancel={() => setEditingSection(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        title="Delete Layout"
        message="Are you sure you want to delete this layout? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleDeleteLayout}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setLayoutToDelete(null);
        }}
      />
    </div>
  );
};

export default HomeLayoutBuilder;
