(function(){
  "use strict";

  var TOKEN_KEY = "virai_admin_token";
  var token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || "";

  var loginView = document.getElementById("loginView");
  var dashboardView = document.getElementById("dashboardView");
  var loginForm = document.getElementById("loginForm");
  var loginErr = document.getElementById("loginErr");
  var btnLogout = document.getElementById("btnLogout");
  var toast = document.getElementById("toast");
  var toastMsg = document.getElementById("toastMsg");
  var toastTimer = null;

  function showToast(msg){
    if(!toast) return;
    toastMsg.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){
      toast.classList.remove("show");
    }, 3500);
  }

  function fmt(n){
    return "₹" + Number(n || 0).toLocaleString("en-IN");
  }

  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  function api(endpoint, options){
    options = options || {};
    options.headers = options.headers || {};
    if(token){
      options.headers["Authorization"] = "Bearer " + token;
    }
    if(options.body && typeof options.body === "object" && !(options.body instanceof FormData)){
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    return fetch(endpoint, options)
      .then(function(res){
        if(res.status === 401){
          // Unauthorized: clear token and show login
          token = "";
          sessionStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(TOKEN_KEY);
          showLogin("Session expired. Please sign in again.");
          throw new Error("Unauthorized");
        }
        return res.json().then(function(data){
          if(!res.ok || data.success === false){
            throw new Error(data.error || "Request failed");
          }
          return data;
        });
      });
  }

  // --- UI Switching ---
  function showLogin(err){
    loginView.style.display = "flex";
    dashboardView.style.display = "none";
    if(err){
      loginErr.style.display = "block";
      loginErr.textContent = err;
    } else {
      loginErr.style.display = "none";
    }
  }

  function showDashboard(username){
    loginView.style.display = "none";
    dashboardView.style.display = "block";
    var userLabel = document.getElementById("adminUserLabel");
    if(userLabel) userLabel.textContent = username || "admin";
    loadOverview();
    loadProducts();
    loadCoupons();
    loadOrders();
    loadSettings();
  }

  // --- Initial Auth Check ---
  if(token){
    api("/api/admin/me")
      .then(function(res){
        showDashboard(res.username);
      })
      .catch(function(){
        showLogin();
      });
  } else {
    showLogin();
  }

  // --- Login Submission ---
  if(loginForm){
    loginForm.addEventListener("submit", function(e){
      e.preventDefault();
      var username = document.getElementById("loginUser").value.trim();
      var password = document.getElementById("loginPass").value;
      if(!username || !password) return;

      var btn = loginForm.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Verifying...";
      loginErr.style.display = "none";

      fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password })
      })
      .then(function(res){
        return res.json().then(function(data){
          if(!res.ok || !data.success){
            throw new Error(data.error || "Authentication failed");
          }
          return data;
        });
      })
      .then(function(data){
        token = data.token;
        sessionStorage.setItem(TOKEN_KEY, token);
        showDashboard(data.username);
        showToast("Signed in securely as " + data.username);
      })
      .catch(function(err){
        loginErr.style.display = "block";
        loginErr.textContent = err.message;
      })
      .finally(function(){
        btn.disabled = false;
        btn.textContent = "Enter Administration Portal";
      });
    });
  }

  // --- Logout ---
  if(btnLogout){
    btnLogout.addEventListener("click", function(){
      api("/api/admin/logout", { method: "POST" })
        .finally(function(){
          token = "";
          sessionStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(TOKEN_KEY);
          showLogin();
          showToast("Signed out");
        });
    });
  }

  // --- Navigation Tabs ---
  var tabButtons = document.querySelectorAll(".admin-tab-btn");
  var tabPanels = document.querySelectorAll(".admin-tab-panel");

  tabButtons.forEach(function(btn){
    btn.addEventListener("click", function(){
      var tabId = btn.getAttribute("data-tab");
      tabButtons.forEach(function(b){ b.classList.remove("active"); });
      tabPanels.forEach(function(p){ p.style.display = "none"; });

      btn.classList.add("active");
      var target = document.getElementById("tab-" + tabId);
      if(target) target.style.display = "block";

      if(tabId === "overview") loadOverview();
      if(tabId === "products") loadProducts();
      if(tabId === "coupons") loadCoupons();
      if(tabId === "orders") loadOrders();
      if(tabId === "settings") loadSettings();
    });
  });

  // --- Modal Utilities ---
  function openModal(modalId){
    var m = document.getElementById(modalId);
    if(m) m.classList.add("open");
  }
  function closeModal(modalId){
    var m = document.getElementById(modalId);
    if(m) m.classList.remove("open");
  }

  document.querySelectorAll("[data-close]").forEach(function(el){
    el.addEventListener("click", function(){
      var modal = el.closest(".modal-overlay");
      if(modal) modal.classList.remove("open");
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(function(m){
    m.addEventListener("click", function(e){
      if(e.target === m) m.classList.remove("open");
    });
  });

  // -------------------------------------------------------------
  // TAB 1: OVERVIEW
  // -------------------------------------------------------------
  function loadOverview(){
    api("/api/admin/overview")
      .then(function(res){
        var stats = res.stats;
        document.getElementById("statProducts").textContent = stats.totalProducts;
        document.getElementById("statCoupons").textContent = stats.activeCoupons;
        document.getElementById("statOrders").textContent = stats.totalOrders;
        document.getElementById("statRevenue").textContent = fmt(stats.totalRevenue);

        var tbody = document.getElementById("recentOrdersBody");
        if(!tbody) return;
        if(!res.recentOrders || res.recentOrders.length === 0){
          tbody.innerHTML = '<tr><td colspan="7" class="center muted" style="padding:2rem">No orders placed yet. Place a test order in checkout to see it appear here.</td></tr>';
          return;
        }

        tbody.innerHTML = res.recentOrders.map(function(o){
          return '<tr>' +
            '<td><strong>'+esc(o.id)+'</strong></td>' +
            '<td>'+esc(o.contact.name)+'<br><span class="small">'+esc(o.contact.email)+'</span></td>' +
            '<td>'+o.items.length+' item(s)</td>' +
            '<td>'+(o.couponCode ? '<span class="status-pill active">'+esc(o.couponCode)+'</span>' : '—')+'</td>' +
            '<td><strong>'+fmt(o.total)+'</strong></td>' +
            '<td><span class="status-pill in_stock">'+esc(o.status || 'Confirmed')+'</span></td>' +
            '<td class="small">'+new Date(o.createdAt).toLocaleDateString()+'</td>' +
            '</tr>';
        }).join("");
      })
      .catch(function(err){
        console.error("Failed to load overview:", err);
      });
  }

  // -------------------------------------------------------------
  // TAB 2: PRODUCTS & PRICING
  // -------------------------------------------------------------
  var allProducts = [];

  function loadProducts(){
    api("/api/admin/products")
      .then(function(res){
        allProducts = res.products || [];
        renderProductsTable(allProducts);
      })
      .catch(function(err){
        showToast("Error loading products: " + err.message);
      });
  }

  function renderProductsTable(products){
    var tbody = document.getElementById("productsTableBody");
    if(!tbody) return;

    if(products.length === 0){
      tbody.innerHTML = '<tr><td colspan="7" class="center muted" style="padding:2rem">No products found matching your search.</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(function(p){
      var imgPath = (p.img && p.img.a) ? p.img.a : "img/1a.webp";
      var landscapeName = p.landscape ? (p.landscape.charAt(0).toUpperCase() + p.landscape.slice(1)) : "Collection Set";
      var statusClass = p.status || "in_stock";
      var statusLabel = (p.status || "in_stock").replace("_", " ");

      return '<tr data-prod-id="'+esc(p.id)+'">' +
        '<td><img src="'+esc(imgPath)+'" alt="'+esc(p.name)+'" class="prod-thumb"></td>' +
        '<td><strong>'+esc(p.name)+'</strong><br><span class="small">'+esc(p.sub || p.type)+'</span></td>' +
        '<td>'+esc(landscapeName)+'</td>' +
        '<td><strong style="font-size:1.05rem">'+fmt(p.price)+'</strong></td>' +
        '<td><span class="status-pill '+esc(statusClass)+'">'+esc(statusLabel)+'</span></td>' +
        '<td>'+(p.featured ? '<span class="status-pill in_stock">&#9733; Featured</span>' : '<span class="small muted">Standard</span>')+'</td>' +
        '<td style="text-align:right;white-space:nowrap">' +
          '<button type="button" class="btn btn-line btn-sm btn-edit-price" data-id="'+esc(p.id)+'" data-name="'+esc(p.name)+'" data-price="'+p.price+'" style="margin-right:.4rem">Change Price</button>' +
          '<button type="button" class="btn btn-line btn-sm btn-toggle-stock" data-id="'+esc(p.id)+'" data-status="'+esc(p.status||'in_stock')+'" style="margin-right:.4rem">Toggle Stock</button>' +
          '<button type="button" class="btn btn-line btn-sm btn-danger btn-delete-prod" data-id="'+esc(p.id)+'" data-name="'+esc(p.name)+'">Delete</button>' +
        '</td>' +
        '</tr>';
    }).join("");

    // Attach listeners
    tbody.querySelectorAll(".btn-edit-price").forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-id");
        var name = btn.getAttribute("data-name");
        var curPrice = btn.getAttribute("data-price");

        document.getElementById("editPriceProdId").value = id;
        document.getElementById("editPriceSub").textContent = name + " (Current price: " + fmt(curPrice) + ")";
        document.getElementById("newPriceInput").value = curPrice;
        openModal("modalEditPrice");
      });
    });

    tbody.querySelectorAll(".btn-toggle-stock").forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-id");
        var cur = btn.getAttribute("data-status");
        var next = cur === "in_stock" ? "out_of_stock" : "in_stock";

        api("/api/admin/products/" + encodeURIComponent(id), {
          method: "PUT",
          body: { status: next }
        })
        .then(function(){
          showToast("Stock status updated");
          loadProducts();
        })
        .catch(function(err){
          alert("Could not update status: " + err.message);
        });
      });
    });

    tbody.querySelectorAll(".btn-delete-prod").forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-id");
        var name = btn.getAttribute("data-name");
        if(confirm("Are you sure you want to remove \"" + name + "\"? This will remove it from the catalogue.")){
          api("/api/admin/products/" + encodeURIComponent(id), { method: "DELETE" })
            .then(function(){
              showToast("Product \"" + name + "\" deleted");
              loadProducts();
            })
            .catch(function(err){
              alert("Error deleting product: " + err.message);
            });
        }
      });
    });
  }

  // Product Search filter
  var prodSearch = document.getElementById("prodSearch");
  if(prodSearch){
    prodSearch.addEventListener("input", function(){
      var q = prodSearch.value.trim().toLowerCase();
      if(!q){
        renderProductsTable(allProducts);
        return;
      }
      var filtered = allProducts.filter(function(p){
        return p.name.toLowerCase().indexOf(q) !== -1 ||
          (p.sub && p.sub.toLowerCase().indexOf(q) !== -1) ||
          (p.landscape && p.landscape.toLowerCase().indexOf(q) !== -1) ||
          p.id.toLowerCase().indexOf(q) !== -1;
      });
      renderProductsTable(filtered);
    });
  }

  // Quick Price Form submission
  var quickPriceForm = document.getElementById("quickPriceForm");
  if(quickPriceForm){
    quickPriceForm.addEventListener("submit", function(e){
      e.preventDefault();
      var id = document.getElementById("editPriceProdId").value;
      var newPrice = document.getElementById("newPriceInput").value;
      if(!id || !newPrice) return;

      var btn = quickPriceForm.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Saving...";

      api("/api/admin/products/" + encodeURIComponent(id), {
        method: "PUT",
        body: { price: Number(newPrice) }
      })
      .then(function(res){
        closeModal("modalEditPrice");
        showToast("Price updated to " + fmt(newPrice));
        loadProducts();
      })
      .catch(function(err){
        alert("Failed to update price: " + err.message);
      })
      .finally(function(){
        btn.disabled = false;
        btn.textContent = "Save Price";
      });
    });
  }

  // Add Product Button
  var btnOpenAddProd = document.getElementById("btnOpenAddProd");
  if(btnOpenAddProd){
    btnOpenAddProd.addEventListener("click", function(){
      var form = document.getElementById("productForm");
      if(form) form.reset();
      document.getElementById("prodEditMode").value = "create";
      document.getElementById("prodModalTitle").textContent = "Add New Product";
      openModal("modalProduct");
    });
  }

  // Add Product Form Submission
  var productForm = document.getElementById("productForm");
  if(productForm){
    productForm.addEventListener("submit", function(e){
      e.preventDefault();
      var name = document.getElementById("prodName").value.trim();
      var sub = document.getElementById("prodSub").value.trim();
      var price = Number(document.getElementById("prodPrice").value);
      var landscape = document.getElementById("prodLandscape").value || null;
      var type = document.getElementById("prodType").value;
      var status = document.getElementById("prodStock").value;
      var size = document.getElementById("prodSize").value.trim() || "240 g";
      var burn = document.getElementById("prodBurn").value.trim() || "≈ 50 hours";
      var story = document.getElementById("prodStory").value.trim();
      var featured = document.getElementById("prodFeatured").checked;
      var imgSet = document.getElementById("prodImageSelect").value;

      var img = {
        a: "img/" + imgSet + "a.webp",
        b: "img/" + imgSet + "b.webp",
        c: "img/" + imgSet + "c.webp"
      };

      var btn = document.getElementById("btnSaveProd");
      btn.disabled = true;
      btn.textContent = "Saving...";

      api("/api/admin/products", {
        method: "POST",
        body: {
          name: name,
          sub: sub,
          price: price,
          landscape: landscape,
          type: type,
          status: status,
          size: size,
          burn: burn,
          story: story,
          featured: featured,
          img: img
        }
      })
      .then(function(res){
        closeModal("modalProduct");
        showToast("Product \"" + name + "\" added to catalogue");
        loadProducts();
      })
      .catch(function(err){
        alert("Failed to create product: " + err.message);
      })
      .finally(function(){
        btn.disabled = false;
        btn.textContent = "Save Product";
      });
    });
  }

  // -------------------------------------------------------------
  // TAB 3: COUPONS ENGINE
  // -------------------------------------------------------------
  var allCoupons = [];

  function loadCoupons(){
    api("/api/admin/coupons")
      .then(function(res){
        allCoupons = res.coupons || [];
        renderCouponsTable(allCoupons);
      })
      .catch(function(err){
        showToast("Error loading coupons: " + err.message);
      });
  }

  function renderCouponsTable(coupons){
    var tbody = document.getElementById("couponsTableBody");
    if(!tbody) return;

    if(coupons.length === 0){
      tbody.innerHTML = '<tr><td colspan="8" class="center muted" style="padding:2rem">No coupons created yet. Click "+ Create New Coupon" above.</td></tr>';
      return;
    }

    tbody.innerHTML = coupons.map(function(c){
      var valDisplay = c.type === "percent" ? (c.value + "% off") : (fmt(c.value) + " flat");
      var minDisplay = c.minOrder ? fmt(c.minOrder) : "None";
      var maxDisplay = c.maxDiscount ? fmt(c.maxDiscount) : "—";
      var expiryDisplay = c.validUntil ? new Date(c.validUntil).toLocaleDateString() : "Never";
      var statusClass = c.active ? "active" : "inactive";
      var statusText = c.active ? "Active" : "Disabled";

      return '<tr data-coupon-code="'+esc(c.code)+'">' +
        '<td><strong style="letter-spacing:.06em;font-family:monospace;font-size:1.05rem">'+esc(c.code)+'</strong>' +
          (c.description ? '<br><span class="small">'+esc(c.description)+'</span>' : '') +
        '</td>' +
        '<td><span class="status-pill in_stock">'+esc(valDisplay)+'</span></td>' +
        '<td>'+esc(minDisplay)+'</td>' +
        '<td>'+esc(maxDisplay)+'</td>' +
        '<td><strong>'+(c.timesUsed || 0)+'</strong>' + (c.usageLimit ? ' / ' + c.usageLimit : '') + '</td>' +
        '<td>'+esc(expiryDisplay)+'</td>' +
        '<td><span class="status-pill '+esc(statusClass)+'">'+esc(statusText)+'</span></td>' +
        '<td style="text-align:right;white-space:nowrap">' +
          '<button type="button" class="btn btn-line btn-sm btn-toggle-coupon" data-code="'+esc(c.code)+'" data-active="'+(c.active?'true':'false')+'" style="margin-right:.4rem">' +
            (c.active ? "Deactivate" : "Activate") +
          '</button>' +
          '<button type="button" class="btn btn-line btn-sm btn-danger btn-delete-coupon" data-code="'+esc(c.code)+'">Delete</button>' +
        '</td>' +
        '</tr>';
    }).join("");

    tbody.querySelectorAll(".btn-toggle-coupon").forEach(function(btn){
      btn.addEventListener("click", function(){
        var code = btn.getAttribute("data-code");
        var active = btn.getAttribute("data-active") === "true";
        api("/api/admin/coupons/" + encodeURIComponent(code), {
          method: "PUT",
          body: { active: !active }
        })
        .then(function(){
          showToast("Coupon \"" + code + "\" " + (!active ? "activated" : "deactivated"));
          loadCoupons();
        })
        .catch(function(err){
          alert("Failed to toggle coupon: " + err.message);
        });
      });
    });

    tbody.querySelectorAll(".btn-delete-coupon").forEach(function(btn){
      btn.addEventListener("click", function(){
        var code = btn.getAttribute("data-code");
        if(confirm("Are you sure you want to permanently delete coupon code \"" + code + "\"?")){
          api("/api/admin/coupons/" + encodeURIComponent(code), { method: "DELETE" })
            .then(function(){
              showToast("Coupon \"" + code + "\" deleted");
              loadCoupons();
            })
            .catch(function(err){
              alert("Failed to delete coupon: " + err.message);
            });
        }
      });
    });
  }

  // Open Create Coupon Modal
  var btnOpenAddCoupon = document.getElementById("btnOpenAddCoupon");
  if(btnOpenAddCoupon){
    btnOpenAddCoupon.addEventListener("click", function(){
      var form = document.getElementById("couponForm");
      if(form) form.reset();
      openModal("modalCoupon");
    });
  }

  // Generate Coupon Code Helper
  var btnGenCode = document.getElementById("btnGenCode");
  if(btnGenCode){
    btnGenCode.addEventListener("click", function(){
      var prefixes = ["VIRAI", "GIFT", "AROMA", "FESTIVE", "BLOOM", "AURA"];
      var p = prefixes[Math.floor(Math.random()*prefixes.length)];
      var num = [10, 15, 20, 25, 50, 100, 250, 500][Math.floor(Math.random()*8)];
      document.getElementById("coupCode").value = p + num;
    });
  }

  // Create Coupon Form Submission
  var couponForm = document.getElementById("couponForm");
  if(couponForm){
    couponForm.addEventListener("submit", function(e){
      e.preventDefault();
      var code = document.getElementById("coupCode").value.trim().toUpperCase();
      var type = document.getElementById("coupType").value;
      var val = Number(document.getElementById("coupVal").value);
      var minOrder = Number(document.getElementById("coupMinOrder").value) || 0;
      var maxDisc = Number(document.getElementById("coupMaxDisc").value) || null;
      var expiry = document.getElementById("coupExpiry").value || null;
      var limit = Number(document.getElementById("coupLimit").value) || null;
      var desc = document.getElementById("coupDesc").value.trim();

      var btn = couponForm.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Creating...";

      api("/api/admin/coupons", {
        method: "POST",
        body: {
          code: code,
          type: type,
          value: val,
          minOrder: minOrder,
          maxDiscount: maxDisc,
          validUntil: expiry,
          usageLimit: limit,
          description: desc,
          active: true
        }
      })
      .then(function(){
        closeModal("modalCoupon");
        showToast("Coupon \"" + code + "\" created successfully");
        loadCoupons();
      })
      .catch(function(err){
        alert("Failed to create coupon: " + err.message);
      })
      .finally(function(){
        btn.disabled = false;
        btn.textContent = "Create Coupon";
      });
    });
  }

  // -------------------------------------------------------------
  // TAB 4: ORDERS LOG
  // -------------------------------------------------------------
  function loadOrders(){
    api("/api/admin/orders")
      .then(function(res){
        renderOrdersTable(res.orders || []);
      })
      .catch(function(err){
        showToast("Error loading orders: " + err.message);
      });
  }

  function renderOrdersTable(orders){
    var tbody = document.getElementById("ordersTableBody");
    if(!tbody) return;

    if(orders.length === 0){
      tbody.innerHTML = '<tr><td colspan="8" class="center muted" style="padding:2rem">No customer orders recorded in system yet.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(function(o){
      var itemsSummary = o.items.map(function(i){
        return esc(i.name) + ' (x' + i.qty + ')';
      }).join(', ');

      var addr = o.contact ? (esc(o.contact.address) + ', ' + esc(o.contact.city) + ' ' + esc(o.contact.pincode)) : '—';
      var phone = (o.contact && o.contact.phone) ? esc(o.contact.phone) : '';

      return '<tr data-order-id="'+esc(o.id)+'">' +
        '<td><strong style="font-family:monospace">'+esc(o.id)+'</strong></td>' +
        '<td class="small">'+new Date(o.createdAt).toLocaleString()+'</td>' +
        '<td><strong>'+esc(o.contact.name)+'</strong><br><span class="small">'+esc(o.contact.email)+(phone ? ' · ' + phone : '')+'</span></td>' +
        '<td class="small" style="max-width:220px;line-height:1.4">'+addr+'</td>' +
        '<td class="small" style="max-width:200px">'+itemsSummary+'</td>' +
        '<td>'+(o.couponCode ? '<span class="status-pill active">'+esc(o.couponCode)+' (-'+fmt(o.discount)+')</span>' : '<span class="small muted">None</span>')+'</td>' +
        '<td><strong style="font-size:1rem">'+fmt(o.total)+'</strong><br><span class="small" style="color:var(--mineral)">Subtotal: '+fmt(o.subtotal)+'</span></td>' +
        '<td>' +
          '<select class="order-status-select" data-id="'+esc(o.id)+'" style="font-size:.82rem;padding:.3rem .5rem;background:#fff;border:1px solid var(--line)">' +
            '<option value="Confirmed"'+(o.status==='Confirmed'?' selected':'')+'>Confirmed</option>' +
            '<option value="Dispatched"'+(o.status==='Dispatched'?' selected':'')+'>Dispatched</option>' +
            '<option value="Delivered"'+(o.status==='Delivered'?' selected':'')+'>Delivered</option>' +
            '<option value="Cancelled"'+(o.status==='Cancelled'?' selected':'')+'>Cancelled</option>' +
          '</select>' +
        '</td>' +
        '</tr>';
    }).join("");

    tbody.querySelectorAll(".order-status-select").forEach(function(sel){
      sel.addEventListener("change", function(){
        var id = sel.getAttribute("data-id");
        var status = sel.value;
        api("/api/admin/orders/" + encodeURIComponent(id) + "/status", {
          method: "PUT",
          body: { status: status }
        })
        .then(function(){
          showToast("Order " + id + " marked as " + status);
        })
        .catch(function(err){
          alert("Could not update order status: " + err.message);
        });
      });
    });
  }

  // -------------------------------------------------------------
  // TAB 5: STORE SETTINGS & SECURITY
  // -------------------------------------------------------------
  function loadSettings(){
    api("/api/admin/settings")
      .then(function(res){
        var cfg = res.config;
        if(cfg){
          var setFreeThreshold = document.getElementById("setFreeThreshold");
          if(setFreeThreshold) setFreeThreshold.value = cfg.freeShipThreshold || 3000;

          if(cfg.shipping){
            var setStdShip = document.getElementById("setStdShip");
            if(setStdShip) setStdShip.value = cfg.shipping.standard || 99;

            var setExpShip = document.getElementById("setExpShip");
            if(setExpShip) setExpShip.value = cfg.shipping.express || 350;
          }
        }
      })
      .catch(function(err){
        console.error("Failed to load settings:", err);
      });
  }

  // Shipping Settings Form
  var shippingSettingsForm = document.getElementById("shippingSettingsForm");
  if(shippingSettingsForm){
    shippingSettingsForm.addEventListener("submit", function(e){
      e.preventDefault();
      var freeShipThreshold = Number(document.getElementById("setFreeThreshold").value);
      var std = Number(document.getElementById("setStdShip").value);
      var exp = Number(document.getElementById("setExpShip").value);

      var btn = shippingSettingsForm.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Saving...";

      api("/api/admin/settings", {
        method: "PUT",
        body: {
          freeShipThreshold: freeShipThreshold,
          shipping: { standard: std, express: exp }
        }
      })
      .then(function(){
        showToast("Shipping settings updated successfully");
      })
      .catch(function(err){
        alert("Failed to update shipping: " + err.message);
      })
      .finally(function(){
        btn.disabled = false;
        btn.textContent = "Update Shipping Settings";
      });
    });
  }

  // Change Password Form
  var changePasswordForm = document.getElementById("changePasswordForm");
  if(changePasswordForm){
    changePasswordForm.addEventListener("submit", function(e){
      e.preventDefault();
      var curPass = document.getElementById("curPass").value;
      var newPass = document.getElementById("newPass").value;
      var confirmPass = document.getElementById("confirmPass").value;

      if(newPass !== confirmPass){
        alert("New passwords do not match");
        return;
      }
      if(newPass.length < 8){
        alert("Password must be at least 8 characters");
        return;
      }

      var btn = changePasswordForm.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Updating...";

      api("/api/admin/change-password", {
        method: "POST",
        body: { currentPassword: curPass, newPassword: newPass }
      })
      .then(function(){
        showToast("Admin password updated successfully");
        changePasswordForm.reset();
      })
      .catch(function(err){
        alert("Failed to change password: " + err.message);
      })
      .finally(function(){
        btn.disabled = false;
        btn.textContent = "Change Administrator Password";
      });
    });
  }

})();
