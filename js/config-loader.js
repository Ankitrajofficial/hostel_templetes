/**
 * Config Loader
 * Replaces content in the DOM with values from SiteConfig
 */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof SiteConfig === 'undefined') {
        console.error('SiteConfig is not defined. Make sure site-config.js is loaded before config-loader.js');
        return;
    }

    // 1. Text Content Replacements
    // Usage: <span data-config="brandName">Default Name</span>
    const configElements = document.querySelectorAll('[data-config]');
    configElements.forEach(element => {
        const key = element.getAttribute('data-config');
        if (SiteConfig[key]) {
            element.textContent = SiteConfig[key];
        }
    });

    // 2. Link Replacements (href)
    // Usage: <a href="#" data-config-href="googleMapsLink">Maps</a>
    const linkElements = document.querySelectorAll('[data-config-href]');
    linkElements.forEach(element => {
        const key = element.getAttribute('data-config-href');
        if (SiteConfig[key]) {
            element.href = SiteConfig[key];
        }
    });

     // 3. Image Alt Tag Replacements
    // Usage: <img src="..." data-config-alt="brandName">
    const imgElements = document.querySelectorAll('[data-config-alt]');
    imgElements.forEach(element => {
        const key = element.getAttribute('data-config-alt');
        if (SiteConfig[key]) {
            element.alt = SiteConfig[key];
        }
    });

    // 4. Update Document Title (Optional, if specific meta tag exists)
    // Usage: <meta name="config-title" content="brandNameMeta">
    // OR just simple override if needed, but risky for SEO optimization if not handled carefully.
    // We will stick to DOM elements for now.
    
    console.log('Site configuration applied:', SiteConfig.brandName);
});
