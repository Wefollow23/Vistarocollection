// =========================
// script.js — Vistaro Collection
// =========================

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { 
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// ------------------------------------------------------
// 🔐 INSERT YOUR FIREBASE CONFIG HERE
// Replace the object below with your actual config
// (from your Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyCj0PffLL4gjLEcndJwD-guceGVdQCEh_w",
  authDomain: "wefollow-789a9.firebaseapp.com",
  databaseURL: "https://wefollow-789a9-default-rtdb.firebaseio.com",
  projectId: "wefollow-789a9",
  storageBucket: "wefollow-789a9.firebasestorage.app",
  messagingSenderId: "975020938711",
  appId: "1:975020938711:web:7ecdb5c7936d5215df2792",
  measurementId: "G-56NMLBLNWT"
};
// ------------------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Detect which page is open
const isSeller = location.pathname.includes("seller.html");

/* ======================================================
   STORE FRONT (index.html)
   ====================================================== */
if (!isSeller) {
  const productContainer = document.getElementById("productContainer");
  const bannerContainer = document.getElementById("bannerContainer");
  const orderModal = document.getElementById("orderModal");
  const closeModal = document.getElementById("closeModal");
  const orderForm = document.getElementById("orderForm");

  // Load homepage banners
  async function loadBanners() {
    bannerContainer.innerHTML = "";
    const bannersSnap = await getDocs(collection(db, "banners"));
    bannersSnap.forEach(async (bannerDoc) => {
      const data = bannerDoc.data();
      const img = document.createElement("img");
      img.src = data.url;
      img.className = "banner-img";
      bannerContainer.appendChild(img);
    });
  }

  // Load all products
  async function loadProducts() {
    productContainer.innerHTML = "";
    const querySnap = await getDocs(collection(db, "products"));
    querySnap.forEach((docSnap) => {
      const p = docSnap.data();
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <p class="stock">In Stock: ${p.qty}</p>
        <button class="buyBtn">Buy Now</button>
      `;
      card.querySelector(".buyBtn").onclick = () => openOrderModal(p.name, p.price);
      productContainer.appendChild(card);
    });
  }

  // Order modal
  function openOrderModal(name, price) {
    orderModal.style.display = "flex";
    document.getElementById("orderProduct").value = name;
    document.getElementById("orderPrice").textContent = "₹" + price;
  }
  closeModal.onclick = () => (orderModal.style.display = "none");

  // Submit order
  orderForm.onsubmit = async (e) => {
    e.preventDefault();
    const order = {
      name: document.getElementById("custName").value,
      address: document.getElementById("custAddress").value,
      pincode: document.getElementById("custPincode").value,
      phone: document.getElementById("custPhone").value,
      product: document.getElementById("orderProduct").value,
      status: "Pending",
      date: new Date().toLocaleString(),
    };
    await addDoc(collection(db, "orders"), order);
    alert("✅ Order placed successfully with COD!");
    orderForm.reset();
    orderModal.style.display = "none";
  };

  // Run on load
  loadBanners();
  loadProducts();
}

/* ======================================================
   SELLER PANEL (seller.html)
   ====================================================== */
if (isSeller) {
  const lockScreen = document.getElementById("lockScreen");
  const dashboard = document.getElementById("dashboard");
  const unlockBtn = document.getElementById("unlockBtn");
  const pinInput = document.getElementById("pinInput");
  const pinMsg = document.getElementById("pinMsg");

  unlockBtn.onclick = () => {
    if (pinInput.value === "2012") {
      lockScreen.classList.add("hidden");
      dashboard.classList.remove("hidden");
      loadProducts();
      loadOrders();
      loadBanners();
    } else {
      pinMsg.textContent = "❌ Wrong PIN!";
    }
  };

  // Tab switching
  document.querySelectorAll(".tab-buttons button").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.getElementById(btn.dataset.tab).classList.add("active");
    };
  });

  // ---------- PRODUCTS ----------
  const productForm = document.getElementById("productForm");
  const productTable = document.getElementById("productTable");

  productForm.onsubmit = async (e) => {
    e.preventDefault();
    const file = document.getElementById("prodImage").files[0];
    const name = document.getElementById("prodName").value;
    const price = document.getElementById("prodPrice").value;
    const qty = document.getElementById("prodQty").value;

    const imgRef = ref(storage, "products/" + file.name);
    await uploadBytes(imgRef, file);
    const url = await getDownloadURL(imgRef);

    await addDoc(collection(db, "products"), {
      name,
      price,
      qty,
      image: url,
    });

    alert("✅ Product added!");
    productForm.reset();
    loadProducts();
  };

  async function loadProducts() {
    productTable.innerHTML = "";
    const querySnap = await getDocs(collection(db, "products"));
    querySnap.forEach((docSnap) => {
      const p = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><img src="${p.image}" class="table-img"></td>
        <td>${p.name}</td>
        <td>₹${p.price}</td>
        <td>${p.qty}</td>
        <td><button class="delBtn">🗑️</button></td>
      `;
      tr.querySelector(".delBtn").onclick = async () => {
        if (confirm("Delete this product?")) {
          await deleteDoc(doc(db, "products", docSnap.id));
          loadProducts();
        }
      };
      productTable.appendChild(tr);
    });
  }

  // ---------- ORDERS ----------
  const orderTable = document.getElementById("orderTable");

  async function loadOrders() {
    orderTable.innerHTML = "";
    const querySnap = await getDocs(collection(db, "orders"));
    querySnap.forEach((docSnap) => {
      const o = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.name}</td>
        <td>${o.product}</td>
        <td>${o.address}, ${o.pincode}</td>
        <td>${o.phone}</td>
        <td>${o.status}</td>
        <td><button class="doneBtn">✔️</button></td>
      `;
      tr.querySelector(".doneBtn").onclick = async () => {
        await updateDoc(doc(db, "orders", docSnap.id), { status: "Accepted" });
        loadOrders();
      };
      orderTable.appendChild(tr);
    });
  }

  // ---------- BANNERS ----------
  const bannerInput = document.getElementById("bannerInput");
  const uploadBannerBtn = document.getElementById("uploadBannerBtn");
  const bannerList = document.getElementById("bannerList");

  uploadBannerBtn.onclick = async () => {
    const file = bannerInput.files[0];
    if (!file) return alert("Select an image first!");

    const imgRef = ref(storage, "banners/" + file.name);
    await uploadBytes(imgRef, file);
    const url = await getDownloadURL(imgRef);
    await addDoc(collection(db, "banners"), { url });

    alert("✅ Banner uploaded!");
    loadBanners();
  };

  async function loadBanners() {
    bannerList.innerHTML = "";
    const querySnap = await getDocs(collection(db, "banners"));
    querySnap.forEach((docSnap) => {
      const b = docSnap.data();
      const div = document.createElement("div");
      div.innerHTML = `<img src="${b.url}" class="table-img">`;
      bannerList.appendChild(div);
    });
  }
}
