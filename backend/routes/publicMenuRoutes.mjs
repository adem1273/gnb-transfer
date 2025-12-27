import express from 'express';
import Menu from '../models/Menu.mjs';
import Page from '../models/Page.mjs';
import logger from '../config/logger.mjs';

const router = express.Router();

/**
 * @route   GET /api/menus/:location
 * @desc    Get active menu by location (public endpoint)
 * @access  Public
 */
router.get('/:location', async (req, res) => {
  try {
    const { location } = req.params;

    // Validate location
    if (!['header', 'footer'].includes(location)) {
      return res.apiError('Location must be either header or footer', 400);
    }

    // Find active menus for the location
    const menus = await Menu.findActiveByLocation(location);

    if (!menus || menus.length === 0) {
      // Return empty menu if no active menus found
      return res.apiSuccess(
        {
          location,
          items: [],
        },
        'No active menu found for this location'
      );
    }

    // Get the first active menu (assuming one menu per location)
    const menu = menus[0];

    // Validate and enrich menu items
    const validatedItems = [];
    for (const item of menu.getSortedItems()) {
      const menuItem = {
        label: item.label,
        order: item.order,
      };

      // If it's a page slug, verify the page exists and is published
      if (item.pageSlug) {
        const page = await Page.findBySlug(item.pageSlug);
        if (page && page.published) {
          menuItem.url = `/pages/${item.pageSlug}`;
          menuItem.type = 'internal';
          validatedItems.push(menuItem);
        }
        // Skip unpublished or missing pages silently
      }

      // If it's an external URL, include it
      if (item.externalUrl) {
        menuItem.url = item.externalUrl;
        menuItem.type = 'external';
        validatedItems.push(menuItem);
      }
    }

    // Set caching headers (cache for 5 minutes)
    res.set('Cache-Control', 'public, max-age=300');

    return res.apiSuccess(
      {
        location,
        items: validatedItems,
      },
      'Menu retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching public menu:', {
      error: error.message,
      stack: error.stack,
    });
    return res.apiError('Failed to fetch menu', 500);
  }
});

/**
 * @route   GET /api/menus
 * @desc    Get all active menus (header and footer)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Find all active menus
    const headerMenus = await Menu.findActiveByLocation('header');
    const footerMenus = await Menu.findActiveByLocation('footer');

    const headerMenu = headerMenus[0];
    const footerMenu = footerMenus[0];

    const result = {
      header: { location: 'header', items: [] },
      footer: { location: 'footer', items: [] },
    };

    // Process header menu
    if (headerMenu) {
      const validatedHeaderItems = [];
      for (const item of headerMenu.getSortedItems()) {
        const menuItem = {
          label: item.label,
          order: item.order,
        };

        if (item.pageSlug) {
          const page = await Page.findBySlug(item.pageSlug);
          if (page && page.published) {
            menuItem.url = `/pages/${item.pageSlug}`;
            menuItem.type = 'internal';
            validatedHeaderItems.push(menuItem);
          }
        }

        if (item.externalUrl) {
          menuItem.url = item.externalUrl;
          menuItem.type = 'external';
          validatedHeaderItems.push(menuItem);
        }
      }
      result.header.items = validatedHeaderItems;
    }

    // Process footer menu
    if (footerMenu) {
      const validatedFooterItems = [];
      for (const item of footerMenu.getSortedItems()) {
        const menuItem = {
          label: item.label,
          order: item.order,
        };

        if (item.pageSlug) {
          const page = await Page.findBySlug(item.pageSlug);
          if (page && page.published) {
            menuItem.url = `/pages/${item.pageSlug}`;
            menuItem.type = 'internal';
            validatedFooterItems.push(menuItem);
          }
        }

        if (item.externalUrl) {
          menuItem.url = item.externalUrl;
          menuItem.type = 'external';
          validatedFooterItems.push(menuItem);
        }
      }
      result.footer.items = validatedFooterItems;
    }

    // Set caching headers (cache for 5 minutes)
    res.set('Cache-Control', 'public, max-age=300');

    return res.apiSuccess(result, 'Menus retrieved successfully');
  } catch (error) {
    logger.error('Error fetching public menus:', {
      error: error.message,
      stack: error.stack,
    });
    return res.apiError('Failed to fetch menus', 500);
  }
});

export default router;
