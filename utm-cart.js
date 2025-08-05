(function () {
  'use strict';

  // IMMEDIATE WINDOW.OPEN OVERRIDE - BLOCK ALL POPUPS
  var originalWindowOpen = window.open;
  window.open = function (url, name, specs) {
    // Block ALL popup specifications for checkout URLs
    if (
      url &&
      (url.includes('checkout') ||
        url.includes('checkouts') ||
        url.includes('lubenipharmacy.com'))
    ) {
      // Add UTM parameters before opening
      url = addUTMToCheckoutURL(url);
      // Force tab by removing ALL window specifications
      return originalWindowOpen.call(window, url, '_blank');
    }
    return originalWindowOpen.call(this, url, name, specs);
  };

  // ENHANCED UTM + GOOGLE ADS TRACKING PARAMETERS WITH COOKIE PERSISTENCE
  function getParameters() {
    var params = {};
    var parser = document.createElement('a');
    parser.href = window.location.href;
    var query = parser.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      // Include UTM parameters and Google Ads tracking parameters
      if (
        pair[0].startsWith('utm_') ||
        pair[0] === 'gclid' ||
        pair[0] === 'gad_campaignid' ||
        pair[0] === 'gbraid'
      ) {
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
    }
    return params;
  }

  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
  }

  function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  var params = getParameters();
  var serializedParams = '';

  if (Object.keys(params).length > 0) {
    serializedParams = Object.keys(params)
      .map(function (key) {
        return key + '=' + params[key];
      })
      .join('&');
    setCookie('utm_params', serializedParams, 30);
  } else {
    var cookieParams = getCookie('utm_params') || '';
    if (!cookieParams) {
      // Enhanced fallback for Google Ads tracking parameters
      var trackingParams = [];

      // Check for gclid in _gcl_aw cookie
      var gcl_aw = getCookie('_gcl_aw');
      if (gcl_aw) {
        var gclid = gcl_aw.split('.').pop();
        trackingParams.push('gclid=' + gclid);
      }

      // Check for gbraid in _gcl_gb cookie
      var gcl_gb = getCookie('_gcl_gb');
      if (gcl_gb) {
        var gbraid = gcl_gb.split('.').pop();
        trackingParams.push('gbraid=' + gbraid);
      }

      // Check for campaign ID in _gcl_aw or other Google cookies
      var gcl_dc = getCookie('_gcl_dc');
      if (gcl_dc) {
        // Extract campaign ID if available in the cookie
        var campaignMatch = gcl_dc.match(/campaignid\.([^.]+)/);
        if (campaignMatch) {
          trackingParams.push('gad_campaignid=' + campaignMatch[1]);
        }
      }

      cookieParams = trackingParams.join('&');
    }
    serializedParams = cookieParams;
  }

  window.utmParams = serializedParams;

  // UTM TO CHECKOUT URL FUNCTION
  function addUTMToCheckoutURL(url) {
    if (!serializedParams || !url) return url;
    var separator = url.indexOf('?') > -1 ? '&' : '?';
    return url + separator + serializedParams;
  }

  // Configuration
  const config = {
    domain: 'lubenipharmacy.com',
    storefrontAccessToken: '17848453ee4ac3f52553b1d1839a3873',
    productId: '<?php echo esc_js($product_id); ?>',
    containerId: '<?php echo esc_js($unique_id); ?>',
    moneyFormat: 'AED%20%7B%7Bamount%7D%7D',
  };

  // Error handling
  function handleError(error) {
    console.error('Shopify Buy Button Error:', error);
    const container = document.getElementById(config.containerId);
    if (container) {
      container.innerHTML =
        '<p class="shopify-error">Unable to load product. Please try again later.</p>';
    }
  }

  // Initialize Shopify Buy Button with UTM functionality
  function initShopifyBuy() {
    try {
      const client = ShopifyBuy.buildClient({
        domain: config.domain,
        storefrontAccessToken: config.storefrontAccessToken,
      });

      // Override checkout creation to inject UTM parameters
      const originalCreateCheckout = client.checkout.create;
      client.checkout.create = function (input) {
        return originalCreateCheckout
          .call(this, input)
          .then(function (checkout) {
            if (serializedParams && checkout.webUrl) {
              checkout.webUrl = addUTMToCheckoutURL(checkout.webUrl);
            }
            return checkout;
          });
      };

      ShopifyBuy.UI.onReady(client)
        .then(function (ui) {
          const container = document.getElementById(config.containerId);
          if (!container) {
            throw new Error('Container element not found');
          }

          ui.createComponent('product', {
            id: config.productId,
            node: container,
            moneyFormat: config.moneyFormat,
            options: {
              product: {
                styles: {
                  product: {
                    '@media (min-width: 601px)': {
                      'max-width': 'calc(25% - 20px)',
                      'margin-left': '20px',
                      'margin-bottom': '50px',
                    },
                  },
                  title: {
                    'font-family': 'Avant Garde, sans-serif',
                    'font-weight': 'normal',
                    color: '#000000',
                  },
                  button: {
                    'font-size': '18px',
                    padding: '17px 44px',
                    'background-color': '#53c536',
                    'border-radius': '5px',
                    border: 'none',
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    ':hover': {
                      'background-color': '#4bb131',
                    },
                    ':focus': {
                      'background-color': '#4bb131',
                      outline: '2px solid #333',
                      'outline-offset': '2px',
                    },
                  },
                  quantityInput: {
                    'font-size': '18px',
                    padding: '17px',
                  },
                  price: {
                    'font-family': 'Avant Garde, sans-serif',
                    color: '#000000',
                  },
                  compareAt: {
                    'font-family': 'Avant Garde, sans-serif',
                    color: '#666666',
                    'text-decoration': 'line-through',
                  },
                  unitPrice: {
                    'font-family': 'Avant Garde, sans-serif',
                    color: '#000000',
                  },
                  buttonWrapper: {
                    'margin-top': '0',
                  },
                },
                contents: {
                  img: false,
                  title: false,
                  price: false,
                },
                text: {
                  button: 'Add to cart',
                },
              },
              modalProduct: {
                contents: {
                  img: false,
                  imgWithCarousel: true,
                  button: false,
                  buttonWithQuantity: true,
                },
                styles: {
                  product: {
                    '@media (min-width: 601px)': {
                      'max-width': '100%',
                      'margin-left': '0px',
                      'margin-bottom': '0px',
                    },
                  },
                  button: {
                    'font-size': '18px',
                    padding: '17px 44px',
                    'background-color': '#53c536',
                    'border-radius': '5px',
                    border: 'none',
                    width: '100%',
                    ':hover': {
                      'background-color': '#4bb131',
                    },
                    ':focus': {
                      'background-color': '#4bb131',
                    },
                  },
                  quantityInput: {
                    'font-size': '18px',
                    padding: '17px',
                  },
                  title: {
                    'font-family': 'Helvetica Neue, sans-serif',
                    'font-weight': 'bold',
                    'font-size': '26px',
                    color: '#4c4c4c',
                  },
                  price: {
                    'font-family': 'Helvetica Neue, sans-serif',
                    'font-weight': 'normal',
                    'font-size': '18px',
                    color: '#4c4c4c',
                  },
                  compareAt: {
                    'font-family': 'Helvetica Neue, sans-serif',
                    'font-weight': 'normal',
                    'font-size': '15px',
                    color: '#4c4c4c',
                  },
                  unitPrice: {
                    'font-family': 'Helvetica Neue, sans-serif',
                    'font-weight': 'normal',
                    'font-size': '15px',
                    color: '#4c4c4c',
                  },
                },
                text: {
                  button: 'Add to cart',
                },
              },
              cart: {
                styles: {
                  button: {
                    'font-size': '18px',
                    padding: '17px',
                    'background-color': '#53c536',
                    'border-radius': '5px',
                    width: '100%',
                    ':hover': {
                      'background-color': '#4bb131',
                    },
                    ':focus': {
                      'background-color': '#4bb131',
                    },
                  },
                  title: {
                    color: '#000000',
                  },
                  header: {
                    color: '#000000',
                  },
                  lineItems: {
                    color: '#000000',
                  },
                  subtotalText: {
                    color: '#000000',
                  },
                  subtotal: {
                    color: '#000000',
                  },
                  notice: {
                    color: '#000000',
                  },
                  currency: {
                    color: '#000000',
                  },
                  close: {
                    color: '#000000',
                    ':hover': {
                      color: '#666666',
                    },
                  },
                  empty: {
                    color: '#000000',
                  },
                },
                text: {
                  total: 'Subtotal',
                  button: 'Checkout',
                },
              },
              toggle: {
                styles: {
                  toggle: {
                    'background-color': '#53c536',
                    ':hover': {
                      'background-color': '#4bb131',
                    },
                    ':focus': {
                      'background-color': '#4bb131',
                    },
                  },
                  count: {
                    'font-size': '18px',
                  },
                },
              },
              lineItem: {
                styles: {
                  variantTitle: {
                    color: '#000000',
                  },
                  title: {
                    color: '#000000',
                  },
                  price: {
                    color: '#000000',
                  },
                  fullPrice: {
                    color: '#000000',
                  },
                  discount: {
                    color: '#000000',
                  },
                  quantity: {
                    color: '#000000',
                  },
                  quantityIncrement: {
                    color: '#000000',
                    'border-color': '#cccccc',
                  },
                  quantityDecrement: {
                    color: '#000000',
                    'border-color': '#cccccc',
                  },
                  quantityInput: {
                    color: '#000000',
                    'border-color': '#cccccc',
                  },
                },
              },
            },
          });
        })
        .catch(handleError);
    } catch (error) {
      handleError(error);
    }
  }

  // Load Shopify SDK
  function loadShopifySDK() {
    const scriptURL =
      'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
    const script = document.createElement('script');

    script.async = true;
    script.src = scriptURL;
    script.onload = initShopifyBuy;
    script.onerror = function () {
      handleError(new Error('Failed to load Shopify SDK'));
    };

    const head =
      document.getElementsByTagName('head')[0] ||
      document.getElementsByTagName('body')[0];
    head.appendChild(script);
  }

  // CHECKOUT LINK INTERCEPTOR
  function setupCheckoutInterceptors() {
    // Click event interceptor
    document.addEventListener('click', function (e) {
      var target = e.target;

      while (target && target.tagName !== 'A' && target.tagName !== 'BUTTON') {
        target = target.parentElement;
      }

      if (!target) return;

      var href = target.getAttribute('href');

      if (href && (href.includes('/checkout') || href.includes('checkouts/'))) {
        var newHref = addUTMToCheckoutURL(href);
        target.setAttribute('href', newHref);
        // Force remove target attribute to prevent popup
        target.removeAttribute('target');
      }

      if (href && href.includes('shopify.com/checkouts/')) {
        var newHref = addUTMToCheckoutURL(href);
        target.setAttribute('href', newHref);
        // Force remove target attribute to prevent popup
        target.removeAttribute('target');
      }
    });

    // Form submission interceptor
    document.addEventListener('submit', function (e) {
      var form = e.target;
      var action = form.getAttribute('action');

      if (
        action &&
        (action.includes('/checkout') || action.includes('/cart'))
      ) {
        var newAction = addUTMToCheckoutURL(action);
        form.setAttribute('action', newAction);
      }
    });

    // Dynamic content observer
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) {
            var checkoutLinks = node.querySelectorAll
              ? node.querySelectorAll(
                  'a[href*="checkout"], a[href*="checkouts"]'
                )
              : [];
            checkoutLinks.forEach(function (link) {
              var href = link.getAttribute('href');
              if (href) {
                var newHref = addUTMToCheckoutURL(href);
                link.setAttribute('href', newHref);
                // Force remove target to prevent popup behavior
                link.removeAttribute('target');
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // LOCATION AND NETWORK OVERRIDES
  function setupLocationOverrides() {
    // Location href override
    let originalLocationHref =
      Object.getOwnPropertyDescriptor(window.location, 'href') ||
      Object.getOwnPropertyDescriptor(Location.prototype, 'href');

    Object.defineProperty(window.location, 'href', {
      get: function () {
        return originalLocationHref.get.call(this);
      },
      set: function (url) {
        if (
          url &&
          (url.includes('/checkout') || url.includes('checkouts/')) &&
          serializedParams
        ) {
          url = addUTMToCheckoutURL(url);
        }
        return originalLocationHref.set.call(this, url);
      },
    });

    // Network request interceptor
    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
      if (
        typeof url === 'string' &&
        (url.includes('/checkout') || url.includes('checkouts/')) &&
        serializedParams
      ) {
        url = addUTMToCheckoutURL(url);
      }
      return originalFetch.call(this, url, options);
    };

    // Location methods override
    const originalReplace = window.location.replace;
    window.location.replace = function (url) {
      if (
        url &&
        (url.includes('/checkout') || url.includes('checkouts/')) &&
        serializedParams
      ) {
        url = addUTMToCheckoutURL(url);
      }
      return originalReplace.call(this, url);
    };

    const originalAssign = window.location.assign;
    window.location.assign = function (url) {
      if (
        url &&
        (url.includes('/checkout') || url.includes('checkouts/')) &&
        serializedParams
      ) {
        url = addUTMToCheckoutURL(url);
      }
      return originalAssign.call(this, url);
    };
  }

  // Initialize everything when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupCheckoutInterceptors();
      setupLocationOverrides();
    });
  } else {
    setupCheckoutInterceptors();
    setupLocationOverrides();
  }

  // Initialize Shopify Buy Button
  if (window.ShopifyBuy && window.ShopifyBuy.UI) {
    initShopifyBuy();
  } else {
    loadShopifySDK();
  }
})();
