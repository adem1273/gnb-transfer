/**
 * Central image configuration for GNB Transfer
 * All images are royalty-free, WebP format, <150KB
 * Local images in public/images/ with lazy load + srcset support
 *
 * Image naming convention:
 * - hero: hero-{nn}-{description}.webp
 * - fleet: fleet-{vehicle}-{variant}.webp
 * - services: service-{name}.webp
 * - trust: trust-{description}.webp
 * - blog: blog/{category}/{topic}-{nn}.webp
 *
 * Alt texts are internationalized via i18n keys (images.{section}.{key})
 */

// Configuration flag to toggle between local and external images
// Set to true when local images are properly replaced with professional photos
export const USE_LOCAL_IMAGES = false;

// Local image base path
const LOCAL_BASE = '/images';

// Hero Slider Images - 4 luxury van photos with international families
export const heroImages = [
  {
    id: 'hero-1',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-01-white-vito-family.webp`
      : 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1920&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-01-white-vito-family.webp`
      : 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1920&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-01-white-vito-family.webp 1920w`
      : 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=640&q=80&auto=format 640w, https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1280&q=80&auto=format 1280w, https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1920&q=80&auto=format 1920w',
    altKey: 'images.hero.luxuryVanFamily',
    category: 'hero',
    localPath: `${LOCAL_BASE}/hero/hero-01-white-vito-family.webp`,
  },
  {
    id: 'hero-2',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-02-black-vito-driver-sign.webp`
      : 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1920&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-02-black-vito-driver-sign.webp`
      : 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1920&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-02-black-vito-driver-sign.webp 1920w`
      : 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=640&q=80&auto=format 640w, https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1280&q=80&auto=format 1280w, https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1920&q=80&auto=format 1920w',
    altKey: 'images.hero.airportPickup',
    category: 'hero',
    localPath: `${LOCAL_BASE}/hero/hero-02-black-vito-driver-sign.webp`,
  },
  {
    id: 'hero-3',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-03-sprinter-airport.webp`
      : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-03-sprinter-airport.webp`
      : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-03-sprinter-airport.webp 1920w`
      : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=640&q=80&auto=format 640w, https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1280&q=80&auto=format 1280w, https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&q=80&auto=format 1920w',
    altKey: 'images.hero.premiumTransfer',
    category: 'hero',
    localPath: `${LOCAL_BASE}/hero/hero-03-sprinter-airport.webp`,
  },
  {
    id: 'hero-4',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-04-family-travel.webp`
      : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-04-family-travel.webp`
      : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/hero/hero-04-family-travel.webp 1920w`
      : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=640&q=80&auto=format 640w, https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1280&q=80&auto=format 1280w, https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80&auto=format 1920w',
    altKey: 'images.hero.familyTravel',
    category: 'hero',
    localPath: `${LOCAL_BASE}/hero/hero-04-family-travel.webp`,
  },
];

// Fleet Section Images - 12 vehicle photos (exterior + interior)
export const fleetImages = [
  // Mercedes Vito exterior
  {
    id: 'fleet-vito-ext-1',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-vito-white-exterior.webp`
      : 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-vito-white-exterior.webp`
      : 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-vito-white-exterior.webp 800w`
      : 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.mercedesVitoExterior',
    category: 'fleet',
    vehicleType: 'Mercedes Vito',
    color: 'white',
    localPath: `${LOCAL_BASE}/fleet/fleet-mercedes-vito-white-exterior.webp`,
  },
  {
    id: 'fleet-vito-ext-2',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-vito-black-exterior.webp`
      : 'https://images.unsplash.com/photo-1609520505218-7421df70e1f5?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-vito-black-exterior.webp`
      : 'https://images.unsplash.com/photo-1609520505218-7421df70e1f5?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-vito-black-exterior.webp 800w`
      : 'https://images.unsplash.com/photo-1609520505218-7421df70e1f5?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1609520505218-7421df70e1f5?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.mercedesVitoBlack',
    category: 'fleet',
    vehicleType: 'Mercedes Vito',
    color: 'black',
    localPath: `${LOCAL_BASE}/fleet/fleet-mercedes-vito-black-exterior.webp`,
  },
  // Mercedes Viano
  {
    id: 'fleet-viano-ext-1',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-viano-silver-exterior.webp`
      : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-viano-silver-exterior.webp`
      : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-viano-silver-exterior.webp 800w`
      : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.mercedesVianoSilver',
    category: 'fleet',
    vehicleType: 'Mercedes Viano',
    color: 'silver',
    localPath: `${LOCAL_BASE}/fleet/fleet-mercedes-viano-silver-exterior.webp`,
  },
  {
    id: 'fleet-viano-ext-2',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-viano-white-exterior.webp`
      : 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-viano-white-exterior.webp`
      : 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-viano-white-exterior.webp 800w`
      : 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.mercedesVianoWhite',
    category: 'fleet',
    vehicleType: 'Mercedes Viano',
    color: 'white',
    localPath: `${LOCAL_BASE}/fleet/fleet-mercedes-viano-white-exterior.webp`,
  },
  // Mercedes Sprinter
  {
    id: 'fleet-sprinter-ext-1',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-sprinter-white-exterior.webp`
      : 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-sprinter-white-exterior.webp`
      : 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-sprinter-white-exterior.webp 800w`
      : 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.mercedesSprinterWhite',
    category: 'fleet',
    vehicleType: 'Mercedes Sprinter',
    color: 'white',
    localPath: `${LOCAL_BASE}/fleet/fleet-mercedes-sprinter-white-exterior.webp`,
  },
  {
    id: 'fleet-sprinter-ext-2',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-sprinter-black-exterior.webp`
      : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-sprinter-black-exterior.webp`
      : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-mercedes-sprinter-black-exterior.webp 800w`
      : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.mercedesSprinterBlack',
    category: 'fleet',
    vehicleType: 'Mercedes Sprinter',
    color: 'black',
    localPath: `${LOCAL_BASE}/fleet/fleet-mercedes-sprinter-black-exterior.webp`,
  },
  // Interior shots
  {
    id: 'fleet-interior-1',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-interior-leather-seats.webp`
      : 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-interior-leather-seats.webp`
      : 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-interior-leather-seats.webp 800w`
      : 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.leatherInterior',
    category: 'fleet-interior',
    localPath: `${LOCAL_BASE}/fleet/fleet-interior-leather-seats.webp`,
  },
  {
    id: 'fleet-interior-2',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-interior-spacious.webp`
      : 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-interior-spacious.webp`
      : 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-interior-spacious.webp 800w`
      : 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.spaciousInterior',
    category: 'fleet-interior',
    localPath: `${LOCAL_BASE}/fleet/fleet-interior-spacious.webp`,
  },
  {
    id: 'fleet-interior-3',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-interior-premium.webp`
      : 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-interior-premium.webp`
      : 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-interior-premium.webp 800w`
      : 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.premiumSeating',
    category: 'fleet-interior',
    localPath: `${LOCAL_BASE}/fleet/fleet-interior-premium.webp`,
  },
  // Trunk/luggage space
  {
    id: 'fleet-trunk-1',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-trunk-luggage.webp`
      : 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-trunk-luggage.webp`
      : 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-trunk-luggage.webp 800w`
      : 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.spaciousTrunk',
    category: 'fleet-trunk',
    localPath: `${LOCAL_BASE}/fleet/fleet-trunk-luggage.webp`,
  },
  {
    id: 'fleet-trunk-2',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-trunk-spacious.webp`
      : 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-trunk-spacious.webp`
      : 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-trunk-spacious.webp 800w`
      : 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.luggageHandling',
    category: 'fleet-trunk',
    localPath: `${LOCAL_BASE}/fleet/fleet-trunk-spacious.webp`,
  },
  {
    id: 'fleet-trunk-3',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-trunk-cargo.webp`
      : 'https://images.unsplash.com/photo-1600661653561-629509216228?w=800&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-trunk-cargo.webp`
      : 'https://images.unsplash.com/photo-1600661653561-629509216228?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/fleet/fleet-trunk-cargo.webp 800w`
      : 'https://images.unsplash.com/photo-1600661653561-629509216228?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1600661653561-629509216228?w=800&q=80&auto=format 800w',
    altKey: 'images.fleet.cargoSpace',
    category: 'fleet-trunk',
    localPath: `${LOCAL_BASE}/fleet/fleet-trunk-cargo.webp`,
  },
];

// Extra Services Images - Child seat, baby seat, meet & greet, VIP lounge
export const serviceImages = {
  childSeat: {
    id: 'service-child-seat',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-child-seat.webp`
      : 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=400&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-child-seat.webp`
      : 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=400&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-child-seat.webp 400w`
      : 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=200&q=80&auto=format 200w, https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=400&q=80&auto=format 400w',
    altKey: 'images.services.childSeat',
    localPath: `${LOCAL_BASE}/services/service-child-seat.webp`,
  },
  babySeat: {
    id: 'service-baby-seat',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-baby-seat.webp`
      : 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-baby-seat.webp`
      : 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-baby-seat.webp 400w`
      : 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=200&q=80&auto=format 200w, https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80&auto=format 400w',
    altKey: 'images.services.babySeat',
    localPath: `${LOCAL_BASE}/services/service-baby-seat.webp`,
  },
  meetAndGreet: {
    id: 'service-meet-greet',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-meet-greet-sign.webp`
      : 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-meet-greet-sign.webp`
      : 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-meet-greet-sign.webp 400w`
      : 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=200&q=80&auto=format 200w, https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&q=80&auto=format 400w',
    altKey: 'images.services.meetAndGreet',
    localPath: `${LOCAL_BASE}/services/service-meet-greet-sign.webp`,
  },
  vipLounge: {
    id: 'service-vip-lounge',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-vip-lounge.webp`
      : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-vip-lounge.webp`
      : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-vip-lounge.webp 400w`
      : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=200&q=80&auto=format 200w, https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=80&auto=format 400w',
    altKey: 'images.services.vipLounge',
    localPath: `${LOCAL_BASE}/services/service-vip-lounge.webp`,
  },
  nameSign: {
    id: 'service-name-sign',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-meet-greet-sign.webp`
      : 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-meet-greet-sign.webp`
      : 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/services/service-meet-greet-sign.webp 400w`
      : 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&q=80&auto=format 200w, https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80&auto=format 400w',
    altKey: 'images.services.welcomeSign',
    localPath: `${LOCAL_BASE}/services/service-meet-greet-sign.webp`,
  },
};

// Professional Driver Images
export const driverImages = [
  {
    id: 'driver-1',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80&auto=format 300w, https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format 600w',
    altKey: 'images.drivers.professional1',
  },
  {
    id: 'driver-2',
    src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80&auto=format 300w, https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80&auto=format 600w',
    altKey: 'images.drivers.professional2',
  },
  {
    id: 'driver-3',
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80&auto=format 300w, https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80&auto=format 600w',
    altKey: 'images.drivers.professional3',
  },
  {
    id: 'driver-4',
    src: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80&auto=format 300w, https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80&auto=format 600w',
    altKey: 'images.drivers.professional4',
  },
];

// Airport Images (Istanbul Airport & Sabiha Gökçen)
export const airportImages = [
  {
    id: 'airport-istanbul-1',
    src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&auto=format 600w, https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&auto=format 1200w',
    altKey: 'images.airports.istanbulAirport',
    airportName: 'Istanbul Airport',
  },
  {
    id: 'airport-istanbul-2',
    src: 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=1200&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=1200&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=600&q=80&auto=format 600w, https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=1200&q=80&auto=format 1200w',
    altKey: 'images.airports.airportTerminal',
    airportName: 'Airport Terminal',
  },
  {
    id: 'airport-sabiha-1',
    src: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1200&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1200&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=600&q=80&auto=format 600w, https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1200&q=80&auto=format 1200w',
    altKey: 'images.airports.sabihaGokcen',
    airportName: 'Sabiha Gökçen Airport',
  },
  {
    id: 'airport-arrival',
    src: 'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=1200&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=1200&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=600&q=80&auto=format 600w, https://images.unsplash.com/photo-1517400508447-f8dd518b86db?w=1200&q=80&auto=format 1200w',
    altKey: 'images.airports.arrivalHall',
    airportName: 'Arrival Hall',
  },
];

// Trust Badge / Review Images - Happy international families (mixed European/Asian/Turkish/Latin)
export const reviewImages = [
  {
    id: 'review-family-1',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-european.webp`
      : 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-european.webp`
      : 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-european.webp 400w`
      : 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&q=80&auto=format 200w, https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80&auto=format 400w',
    altKey: 'images.reviews.happyFamily1',
    localPath: `${LOCAL_BASE}/trust/trust-happy-family-european.webp`,
  },
  {
    id: 'review-family-2',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-asian.webp`
      : 'https://images.unsplash.com/photo-1484981138541-3d074aa97716?w=400&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-asian.webp`
      : 'https://images.unsplash.com/photo-1484981138541-3d074aa97716?w=400&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-asian.webp 400w`
      : 'https://images.unsplash.com/photo-1484981138541-3d074aa97716?w=200&q=80&auto=format 200w, https://images.unsplash.com/photo-1484981138541-3d074aa97716?w=400&q=80&auto=format 400w',
    altKey: 'images.reviews.happyFamily2',
    localPath: `${LOCAL_BASE}/trust/trust-happy-family-asian.webp`,
  },
  {
    id: 'review-family-3',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-international.webp`
      : 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-international.webp`
      : 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-international.webp 400w`
      : 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&q=80&auto=format 200w, https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80&auto=format 400w',
    altKey: 'images.reviews.happyFamily3',
    localPath: `${LOCAL_BASE}/trust/trust-happy-family-international.webp`,
  },
  {
    id: 'review-family-4',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-european.webp`
      : 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-european.webp`
      : 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-european.webp 400w`
      : 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=200&q=80&auto=format 200w, https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&q=80&auto=format 400w',
    altKey: 'images.reviews.happyFamily4',
    localPath: `${LOCAL_BASE}/trust/trust-happy-family-european.webp`,
  },
  {
    id: 'review-family-5',
    src: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-asian.webp`
      : 'https://images.unsplash.com/photo-1524638431109-93d95c968f03?w=400&q=80&auto=format&fit=crop',
    webp: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-asian.webp`
      : 'https://images.unsplash.com/photo-1524638431109-93d95c968f03?w=400&q=80&auto=format&fit=crop&fm=webp',
    srcSet: USE_LOCAL_IMAGES
      ? `${LOCAL_BASE}/trust/trust-happy-family-asian.webp 400w`
      : 'https://images.unsplash.com/photo-1524638431109-93d95c968f03?w=200&q=80&auto=format 200w, https://images.unsplash.com/photo-1524638431109-93d95c968f03?w=400&q=80&auto=format 400w',
    altKey: 'images.reviews.happyFamily5',
    localPath: `${LOCAL_BASE}/trust/trust-happy-family-asian.webp`,
  },
];

// Blog Images - Travel and tourism
export const blogImages = [
  // Istanbul destinations
  {
    id: 'blog-istanbul-1',
    src: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80&auto=format 800w',
    altKey: 'images.blog.istanbulSkyline',
    category: 'istanbul',
  },
  {
    id: 'blog-istanbul-2',
    src: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80&auto=format 800w',
    altKey: 'images.blog.blueMosque',
    category: 'istanbul',
  },
  {
    id: 'blog-istanbul-3',
    src: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&q=80&auto=format 800w',
    altKey: 'images.blog.hagiaSophia',
    category: 'istanbul',
  },
  // Cappadocia
  {
    id: 'blog-cappadocia-1',
    src: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&q=80&auto=format 800w',
    altKey: 'images.blog.cappadociaBalloons',
    category: 'cappadocia',
  },
  {
    id: 'blog-cappadocia-2',
    src: 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800&q=80&auto=format 800w',
    altKey: 'images.blog.cappadociaLandscape',
    category: 'cappadocia',
  },
  // Pamukkale
  {
    id: 'blog-pamukkale-1',
    src: 'https://images.unsplash.com/photo-1600240644455-3e9c4b2ecb06?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1600240644455-3e9c4b2ecb06?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1600240644455-3e9c4b2ecb06?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1600240644455-3e9c4b2ecb06?w=800&q=80&auto=format 800w',
    altKey: 'images.blog.pamukkaleTerraces',
    category: 'pamukkale',
  },
  // Bursa/Uludag
  {
    id: 'blog-bursa-1',
    src: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&q=80&auto=format 800w',
    altKey: 'images.blog.uludagMountain',
    category: 'bursa',
  },
  // Travel scenes
  {
    id: 'blog-travel-1',
    src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80&auto=format 800w',
    altKey: 'images.blog.travelAdventure',
    category: 'travel',
  },
  {
    id: 'blog-travel-2',
    src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80&auto=format 800w',
    altKey: 'images.blog.scenicRoad',
    category: 'travel',
  },
  {
    id: 'blog-travel-3',
    src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80&auto=format 800w',
    altKey: 'images.blog.mountainView',
    category: 'travel',
  },
];

// About Page Images
export const aboutImages = {
  team: {
    id: 'about-team',
    src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80&auto=format 600w, https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80&auto=format 1200w',
    altKey: 'images.about.ourTeam',
  },
  office: {
    id: 'about-office',
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&auto=format 600w, https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format 1200w',
    altKey: 'images.about.ourOffice',
  },
  mission: {
    id: 'about-mission',
    src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80&auto=format 800w',
    altKey: 'images.about.ourMission',
  },
};

// Services Page Images
export const servicesPageImages = {
  airportTransfer: {
    id: 'services-airport',
    src: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80&auto=format 800w',
    altKey: 'images.servicesPage.airportTransfer',
  },
  cityTours: {
    id: 'services-city',
    src: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80&auto=format 800w',
    altKey: 'images.servicesPage.cityTours',
  },
  privateCharter: {
    id: 'services-charter',
    src: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80&auto=format 800w',
    altKey: 'images.servicesPage.privateCharter',
  },
  corporateTravel: {
    id: 'services-corporate',
    src: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80&auto=format&fit=crop',
    webp: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80&auto=format&fit=crop&fm=webp',
    srcSet:
      'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&q=80&auto=format 400w, https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80&auto=format 800w',
    altKey: 'images.servicesPage.corporateTravel',
  },
};

// All images combined for easy counting and management
export const allImages = [
  ...heroImages,
  ...fleetImages,
  ...Object.values(serviceImages),
  ...driverImages,
  ...airportImages,
  ...reviewImages,
  ...blogImages,
  ...Object.values(aboutImages),
  ...Object.values(servicesPageImages),
];

// Export total count
export const totalImageCount = allImages.length;

export default {
  heroImages,
  fleetImages,
  serviceImages,
  driverImages,
  airportImages,
  reviewImages,
  blogImages,
  aboutImages,
  servicesPageImages,
  allImages,
  totalImageCount,
};
