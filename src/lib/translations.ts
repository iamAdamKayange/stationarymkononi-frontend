import { useSettingsStore } from '../store/useSettingsStore';

export const translations = {
  en: {
    common: {
      appName: "Stationery Mkononi",
      tagline: "Print. Order. Deliver.",
      dashboard: "Dashboard",
      adminHub: "Admin Hub",
      shopPortal: "Shop Portal",
      riderPortal: "Rider Portal",
      logout: "Logout",
      login: "Login",
      register: "Register",
      openNow: "Open Now",
      closed: "Closed",
      rating: "Rating",
      estimatedPrice: "Estimated Price",
      cart: "Cart",
      success: "Success",
      loading: "Loading...",
      currency: "TZS",
      error: "Error",
      back: "Back",
      proceed: "Proceed",
    },
    navbar: {
      home: "Home",
      printDocument: "Print Document",
      stationeries: "Stationeries",
      marketplace: "Marketplace",
      myOrders: "My Orders",
      notifications: "Notifications",
      cart: "Cart",
      login: "Login",
      register: "Register",
    },
    bottomnav: {
      home: "Home",
      print: "Print",
      market: "Market",
      orders: "Orders",
      profile: "Profile",
    },
    home: {
      taglineBadge: "Stationery Mkononi 🇹🇿",
      heroTitle: "What do you need today?",
      heroSubtitle: "Print your documents, order school and office supplies, and get them delivered to your doorstep quickly.",
      printDoc: "Print Document",
      printDocDesc: "A4, A3, Spiral binding etc.",
      buyStationery: "Buy Stationery",
      buyStationeryDesc: "Pens, books, etc.",
      trackOrder: "Track Order",
      trackOrderDesc: "Live GPS map",
      activeOrderTitle: "Order #{num}",
      activeOrderDesc: "From: {shop} • TZS {amount}",
      trackOnMap: "Track on Map",
      nearbyShopsTitle: "Nearby Stationeries",
      nearbyShopsDesc: "Choose a shop close to you for fast printing",
      viewAll: "View All",
      marketplaceTitle: "Stationery Supplies (Marketplace)",
      marketplaceDesc: "Order pens, notebooks, and office supplies delivered anywhere",
      allSupplies: "All Supplies",
      addedToCart: "Added to cart: {name}",
      shopUnavailable: "Shop unavailable right now",
      fastPrintingTitle: "Fast Printing",
      fastPrintingDesc: "Upload files and choose options in minutes.",
      gpsTitle: "Live GPS Delivery",
      gpsDesc: "Track your rider on the map until they reach your door.",
      paymentTitle: "Secure Payment",
      paymentDesc: "Pay easily via M-Pesa, Tigo Pesa, or Airtel Money.",
    },
  },
  sw: {
    common: {
      appName: "Stationery Mkononi",
      tagline: "Print. Order. Deliver.",
      dashboard: "Dashboard",
      adminHub: "Admin Hub",
      shopPortal: "Shop Portal",
      riderPortal: "Rider Portal",
      logout: "Logout",
      login: "Ingia",
      register: "Jisajili",
      openNow: "Wazi Sasa",
      closed: "Imefungwa",
      rating: "Nafasi",
      estimatedPrice: "Gharama ya Uchapaji",
      cart: "Kikapu",
      success: "Mafanikio",
      loading: "Inapakia...",
      currency: "TZS",
      error: "Hitilafu",
      back: "Rudi Nyuma",
      proceed: "Chagua Stationery",
    },
    navbar: {
      home: "Home",
      printDocument: "Print Document",
      stationeries: "Stationeries",
      marketplace: "Marketplace",
      myOrders: "My Orders",
      notifications: "Arifa",
      cart: "Kikapu",
      login: "Ingia",
      register: "Jisajili",
    },
    bottomnav: {
      home: "Home",
      print: "Print",
      market: "Market",
      orders: "Orders",
      profile: "Profile",
    },
    home: {
      taglineBadge: "Stationery Mkononi 🇹🇿",
      heroTitle: "Unahitaji nini leo?",
      heroSubtitle: "Chapa nyaraka zako, agiza vifaa vya ofisi na shule, na upokee mzigo wako mlangoni kwa haraka.",
      printDoc: "Print Document",
      printDocDesc: "A4, A3, Spiral n.k.",
      buyStationery: "Buy Stationery",
      buyStationeryDesc: "Kalamu, vitabu, n.k.",
      trackOrder: "Track Order",
      trackOrderDesc: "Live GPS map",
      activeOrderTitle: "Oda #{num}",
      activeOrderDesc: "Kutoka: {shop} • TZS {amount}",
      trackOnMap: "Fuatilia kwenye Ramani (Track)",
      nearbyShopsTitle: "Stationeries Zinazopatikana",
      nearbyShopsDesc: "Chagua duka la karibu kwa uchapaji wa haraka",
      viewAll: "Ona Zote",
      marketplaceTitle: "Vifaa vya Stationery (Marketplace)",
      marketplaceDesc: "Agiza kalamu, madaftari, na vifaa vya ofisi ufikishiwe popote",
      allSupplies: "Vifaa Vyote",
      addedToCart: "Imeongezwa kwenye kikapu: {name}",
      shopUnavailable: "Duka halipatikani kwa sasa",
      fastPrintingTitle: "Uchapaji wa Haraka",
      fastPrintingDesc: "Pakia faili na uchague machaguo ya printing kwa dakika chache.",
      gpsTitle: "Live GPS Delivery",
      gpsDesc: "Fuatilia rider wako kwenye ramani mpaka afike mlangoni kwako.",
      paymentTitle: "Malipo Salama",
      paymentDesc: "Lipa kwa urahisi kupitia M-Pesa, Tigo Pesa, au Airtel Money.",
    },
  }
};

export function useTranslation() {
  const { language, setLanguage, theme, toggleTheme } = useSettingsStore();

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language as keyof typeof translations];

    for (const k of keys) {
      if (value && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation is missing a key, or return key
        let engVal: any = translations['en'];
        for (const engKey of keys) {
          if (engVal && engKey in engVal) {
            engVal = engVal[engKey];
          } else {
            engVal = null;
            break;
          }
        }
        if (engVal && typeof engVal === 'string') {
          value = engVal;
        } else {
          return key;
        }
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (variables) {
      let result = value;
      Object.entries(variables).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
      return result;
    }

    return value;
  };

  return { t, language, setLanguage, theme, toggleTheme };
}
