const SiteConfig = {
  // Brand Identity
  brandName: "MK HEIGHT",
  brandNameMeta: "MK HEIGHT | Premium Luxury Hostel", // For titles
  brandLogoText: "MK HEIGHT",

  // Contact Information
  address:
    "MK Heights, Coral Park, Near Suwalka Emerald, Bundi Road, Kunadi, Kota, Rajasthan 324008",
  shortAddress: "Kunadi, Kota, Rajasthan",
  phone: "+91 9116666999", // Replace if needed, taking from footer/contact
  email: "info@mkheight.com", // Placeholder, didn't see explicit email in grep, using generic

  // External Links
  googleMapsLink:
    "https://www.google.com/maps/search/?api=1&query=MK+Heights+Kota", // Simple search or specific link

  // Social Media (Examples)
  instagram: "#",
  facebook: "#",
};

// Export for usage if needed (though mostly this will be a global in browser)
if (typeof module !== "undefined" && module.exports) {
  module.exports = SiteConfig;
}
