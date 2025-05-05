// Variables globales
let stream = null;
let model = null;                                 let products = [];
let isScanning = false;                           
// Elementos del DOM
const cameraFeed = document.getElementById('cameraFeed');
const detectionCanvas = document.getElementById('detectionCanvas');                                 const scanBtn = document.getElementById('scanBtn');
const toggleCameraBtn = document.getElementById('toggleCameraBtn');
const productList = document.getElementById('productList');                                         const totalPriceElement = document.getElementById('totalPrice');
const checkoutBtn = document.getElementById('checkoutBtn');
const confirmationModal = document.getElementById('confirmationModal');
const modalProductList = document.getElementById('modalProductList');
const confirmAddBtn = document.getElementById('confirmAddBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const closeModal = document.querySelector('.close-modal');

// Precios de ejemplo (en una app real, esto vendría de una base de datos)
const productPrices = {
    'manzana': 1.20,
    'banana': 0.80,
    'leche': 2.50,
    'pan': 1.80,
    'huevos': 3.20,
    'pollo': 5.75,
    'arroz': 2.30,
    'yogur': 1.10,
    'queso': 4.50,
    'tomate': 1.90
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Cargar el modelo YOLO (versión simplificada para el ejemplo)
        await loadModel();

        // Iniciar la cámara
        await startCamera();

        // Configurar eventos
        setupEventListeners();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        alert('Hubo un error al iniciar la aplicación. Por favor recarga la página.');
    }
});

// Cargar el modelo de IA (simplificado para el ejemplo)
async function loadModel() {
    console.log('Cargando modelo de IA...');
    // En una aplicación real, aquí cargarías el modelo YOLO
    // model = await cocoSsd.load();

    // Simulamos la carga del modelo con un timeout
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Modelo cargado');
}

// Iniciar la cámara
async function startCamera(facingMode = 'environment') {
    try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        cameraFeed.srcObject = stream;

        // Configurar canvas para detecciones
        detectionCanvas.width = cameraFeed.videoWidth;
        detectionCanvas.height = cameraFeed.videoHeight;
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios.');
    }
}

// Configurar event listeners
function setupEventListeners() {
    scanBtn.addEventListener('click', scanProducts);
    toggleCameraBtn.addEventListener('click', toggleCamera);
    checkoutBtn.addEventListener('click', proceedToCheckout);
    confirmAddBtn.addEventListener('click', confirmProductAddition);
    cancelAddBtn.addEventListener('click', closeModalWindow);
    closeModal.addEventListener('click', closeModalWindow);

    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (event) => {
        if (event.target === confirmationModal) {
            closeModalWindow();
        }
    });
}

// Escanear productos
async function scanProducts() {
    if (isScanning) return;

    isScanning = true;
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Escaneando...';

    try {
        // Simulación de detección de productos
        // En una aplicación real, usarías el modelo YOLO aquí:
        // const predictions = await model.detect(cameraFeed);

        // Para el ejemplo, generamos productos aleatorios
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockProducts = generateMockProducts();
        showDetectionResults(mockProducts);
    } catch (error) {
        console.error('Error al escanear productos:', error);
        alert('Error al escanear productos. Intenta nuevamente.');
    } finally {
        isScanning = false;
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<i class="fas fa-camera"></i> Escanear Productos';
    }
}

// Generar productos de ejemplo (simulación)
function generateMockProducts() {
    const productNames = Object.keys(productPrices);
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 productos

    const detectedProducts = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * productNames.length);
        const productName = productNames[randomIndex];
        detectedProducts.push({
            class: productName,
            score: (Math.random() * 0.5 + 0.5).toFixed(2), // 0.5-1.0 de confianza
            bbox: [0, 0, 100, 100] // Bounding box ficticio
        });
    }

    return detectedProducts;
}

// Mostrar resultados de detección
function showDetectionResults(detectedProducts) {
    // Filtrar productos con alta confianza y mapear a nuestro formato
    const newProducts = detectedProducts
        .filter(p => p.score > 0.7)
        .map(p => ({
            name: p.class,
            price: productPrices[p.class] || 0,
            quantity: 1
        }));

    if (newProducts.length === 0) {
        alert('No se detectaron productos con suficiente confianza. Intenta nuevamente.');
        return;
    }

    // Mostrar modal de confirmación
    showConfirmationModal(newProducts);
}

// Mostrar modal de confirmación
function showConfirmationModal(newProducts) {
    modalProductList.innerHTML = '';

    newProducts.forEach(product => {
        const productElement = document.createElement('div');
        productElement.innerHTML = `
            <span>${capitalizeFirstLetter(product.name)}</span>
            <span>$${product.price.toFixed(2)}</span>
        `;
        modalProductList.appendChild(productElement);
    });

    confirmationModal.style.display = 'flex';
}

// Confirmar adición de productos
function confirmProductAddition() {
    const productElements = modalProductList.querySelectorAll('div');
    const newProducts = [];

    productElements.forEach(el => {
        const name = el.children[0].textContent.toLowerCase();
        const price = parseFloat(el.children[1].textContent.replace('$', ''));

        // Verificar si el producto ya existe en el carrito
        const existingProductIndex = products.findIndex(p => p.name === name);

        if (existingProductIndex >= 0) {
            // Incrementar cantidad si ya existe
            products[existingProductIndex].quantity += 1;
        } else {
            // Agregar nuevo producto
            newProducts.push({
                name: name,
                price: price,
                quantity: 1
            });
        }
    });

    // Agregar nuevos productos al carrito
    products = [...products, ...newProducts];

    // Actualizar la lista de productos
    updateProductList();

    // Cerrar el modal
    closeModalWindow();
}

// Cerrar modal
function closeModalWindow() {
    confirmationModal.style.display = 'none';
}

// Actualizar lista de productos
function updateProductList() {
    if (products.length === 0) {
        productList.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-camera"></i>
                <p>Escanea productos para verlos aquí</p>
            </li>
        `;
        checkoutBtn.disabled = true;
        totalPriceElement.textContent = '$0.00';
        return;
    }

    productList.innerHTML = '';
    let total = 0;

    products.forEach((product, index) => {
        total += product.price * product.quantity;

        const productElement = document.createElement('li');
        productElement.className = 'product-item';
        productElement.innerHTML = `
            <span>${capitalizeFirstLetter(product.name)} ${product.quantity > 1 ? `(x${product.quantity})` : ''}</span>
            <span>$${(product.price * product.quantity).toFixed(2)}</span>
        `;

        productList.appendChild(productElement);
    });

    totalPriceElement.textContent = `$${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
}

// Cambiar entre cámara frontal y trasera
function toggleCamera() {
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const newFacingMode = settings.facingMode === 'user' ? 'environment' : 'user';

    startCamera(newFacingMode);
}

// Proceder al pago
function proceedToCheckout() {
    alert(`Redirigiendo al pago. Total: $${calculateTotal().toFixed(2)}`);
    // En una aplicación real, aquí redirigirías al proceso de pago
}

// Calcular total
function calculateTotal() {
    return products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
}

// Helper: capitalizar primera letra
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
              }
