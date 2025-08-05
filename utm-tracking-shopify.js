// IMMEDIATE WINDOW.OPEN OVERRIDE - BLOCK ALL POPUPS
(function () {
  var originalWindowOpen = window.open;
  window.open = function (url, name, specs) {
    // Block ALL popup specifications for checkout URLs
    if (
      url &&
      (url.includes('checkout') ||
        url.includes('checkouts') ||
        url.includes('lubenipharmacy.com'))
    ) {
      // Force tab by removing ALL window specifications
      return originalWindowOpen.call(window, url, '_blank');
    }
    return originalWindowOpen.call(this, url, name, specs);
  };
})();

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

// TABS
function openTab(event, tabId) {
  document
    .querySelectorAll('.tab-content')
    .forEach((tab) => tab.classList.remove('active'));
  document
    .querySelectorAll('.tab-link')
    .forEach((tab) => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  event.currentTarget.classList.add('active');
  $('.products-slider').slick('setPosition');
}

function navigateToTab(url) {
  window.location.href = url;
}

// DOM READY
document.addEventListener('DOMContentLoaded', function () {
  // NUCLEAR APPROACH: Override window.open IMMEDIATELY to block ALL popup specs
  var originalWindowOpen = window.open;
  window.open = function (url, name, specs) {
    // If ANY URL contains checkout, force tab behavior with NO window features
    if (
      url &&
      (url.includes('checkout') ||
        url.includes('checkouts') ||
        url.includes('lubenipharmacy.com'))
    ) {
      url = addUTMToCheckoutURL(url);
      // FORCE TAB: Use only URL and _blank, completely ignore all other parameters
      var newWindow = originalWindowOpen.call(this, url, '_blank');
      return newWindow;
    }
    return originalWindowOpen.call(this, url, name, specs);
  };

  // Initialize Slick Slider
  $('.products-slider').slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    infinite: false,
    arrows: false,
    dots: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1 },
      },
    ],
  });

  // UTM TO CHECKOUT URL
  function addUTMToCheckoutURL(url) {
    if (!serializedParams || !url) return url;
    var separator = url.indexOf('?') > -1 ? '&' : '?';
    return url + separator + serializedParams;
  }

  // Initialize Shopify Buy Buttons AFTER window.open override
  initShopifyBuyButtons();

  // THEME CART: ADD TO CART
  document.querySelectorAll('.custom-add-to-cart').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var variantId =
        btn.getAttribute('data-variant-id') || btn.dataset.variantId;
      var quantity = btn.getAttribute('data-quantity') || 1;

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: variantId,
          quantity: parseInt(quantity),
        }),
      })
        .then(function (response) {
          if (response.ok) {
            if (window.Shopify && Shopify.theme && Shopify.theme.drawer) {
              Shopify.theme.drawer.open();
            } else {
              document.dispatchEvent(new CustomEvent('cart:updated'));
            }
          }
          return response.json();
        })
        .then(function (data) {})
        .catch(function (error) {});
    });
  });

  // UTM TO CHECKOUT URL
  function addUTMToCheckoutURL(url) {
    if (!serializedParams || !url) return url;
    var separator = url.indexOf('?') > -1 ? '&' : '?';
    return url + separator + serializedParams;
  }

  // CHECKOUT LINK INTERCEPTOR
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

  // FORM SUBMISSION INTERCEPTOR
  document.addEventListener('submit', function (e) {
    var form = e.target;
    var action = form.getAttribute('action');

    if (action && (action.includes('/checkout') || action.includes('/cart'))) {
      var newAction = addUTMToCheckoutURL(action);
      form.setAttribute('action', newAction);
    }
  });

  // DYNAMIC CONTENT OBSERVER
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) {
          var checkoutLinks = node.querySelectorAll
            ? node.querySelectorAll('a[href*="checkout"], a[href*="checkouts"]')
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

  // FORCE TAB BEHAVIOR WITH CSS
  var style = document.createElement('style');
  style.textContent = `
            a[href*="checkout"], 
            button[onclick*="checkout"],
            [data-shopify*="checkout"] {
                target: _blank !important;
            }
        `;
  document.head.appendChild(style);
});

// SHOPIFY BUY BUTTON WITH UTM INJECTION
function initShopifyBuyButtons() {
  const scriptURL =
    'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';

  function setupButtons() {
    const client = ShopifyBuy.buildClient({
      domain: 'lubenipharmacy.com',
      storefrontAccessToken: '17848453ee4ac3f52553b1d1839a3873',
    });

    const originalCreateCheckout = client.checkout.create;
    client.checkout.create = function (input) {
      return originalCreateCheckout.call(this, input).then(function (checkout) {
        if (serializedParams && checkout.webUrl) {
          const separator = checkout.webUrl.indexOf('?') > -1 ? '&' : '?';
          checkout.webUrl = checkout.webUrl + separator + serializedParams;
        }
        return checkout;
      });
    };

    ShopifyBuy.UI.onReady(client)
      .then(function (ui) {
        document
          .querySelectorAll('.shopify-buy-button-container')
          .forEach(function (el) {
            const productId = el.getAttribute('data-product-id');
            if (productId) {
              ui.createComponent('product', {
                id: productId,
                node: el,
                moneyFormat: 'AED%20%7B%7Bamount%7D%7D',
                options: {
                  product: {
                    styles: {
                      button: {
                        'font-size': '16px',
                        padding: '15px 25px',
                        'font-weight': '500',
                        ':hover': { 'background-color': '#4bb131' },
                        'background-color': '#499E2C',
                        ':focus': { 'background-color': '#4bb131' },
                        'border-radius': '5px',
                        width: '100%',
                      },
                      buttonWrapper: {
                        'margin-top': '0',
                        width: '100%',
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
                  cart: {
                    styles: {
                      button: {
                        'font-size': '16px',
                        padding: '15px 25px',
                        'font-weight': '500',
                        ':hover': { 'background-color': '#4bb131' },
                        'background-color': '#499E2C',
                        ':focus': { 'background-color': '#4bb131' },
                        'border-radius': '5px',
                      },
                    },
                    text: {
                      total: 'Subtotal',
                      button: 'Checkout',
                    },
                  },
                  productSet: {
                    styles: {
                      products: {
                        '@media (min-width: 601px)': {
                          'margin-left': '-20px',
                        },
                      },
                    },
                  },
                },
              });
            }
          });
      })
      .catch(function (error) {});
  }

  if (window.ShopifyBuy) {
    if (window.ShopifyBuy.UI) {
      setupButtons();
    } else {
      loadScript(setupButtons);
    }
  } else {
    loadScript(setupButtons);
  }

  function loadScript(callback) {
    const script = document.createElement('script');
    script.src = scriptURL;
    script.async = true;
    script.onload = callback;
    script.onerror = function () {};
    document.head.appendChild(script);
  }
}

// LOCATION HREF OVERRIDE
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
      const separator = url.indexOf('?') > -1 ? '&' : '?';
      url = url + separator + serializedParams;
    }
    return originalLocationHref.set.call(this, url);
  },
});

// NETWORK REQUEST INTERCEPTOR
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (
    typeof url === 'string' &&
    (url.includes('/checkout') || url.includes('checkouts/')) &&
    serializedParams
  ) {
    const separator = url.indexOf('?') > -1 ? '&' : '?';
    url = url + separator + serializedParams;
  }
  return originalFetch.call(this, url, options);
};

// LOCATION METHODS OVERRIDE
const originalReplace = window.location.replace;
window.location.replace = function (url) {
  if (
    url &&
    (url.includes('/checkout') || url.includes('checkouts/')) &&
    serializedParams
  ) {
    const separator = url.indexOf('?') > -1 ? '&' : '?';
    url = url + separator + serializedParams;
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
    const separator = url.indexOf('?') > -1 ? '&' : '?';
    url = url + separator + serializedParams;
  }
  return originalAssign.call(this, url);
};
