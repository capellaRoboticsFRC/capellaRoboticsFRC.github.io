// Firebase konfigürasyonu
const firebaseConfig = {
    apiKey: "AIzaSyCwTNJYV15hjAGeY4ugTa4uxBruGg9qOHc",
    authDomain: "future-in-bloom-capella.firebaseapp.com",
    projectId: "future-in-bloom-capella",
    storageBucket: "future-in-bloom-capella.firebasestorage.app",
    messagingSenderId: "926774061121",
    appId: "1:926774061121:web:467c230680dd63ed8d3ec0",
    measurementId: "G-EYTGVZCCK1"
};

// Firebase'i başlat
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase başarıyla başlatıldı!");
    const analytics = firebase.analytics();
} catch (error) {
    console.error("Firebase başlatma hatası:", error);
}

const db = firebase.firestore();

// Çiçek türleri - RESİMLER KÖK DİZİNDE
const FLOWER_TYPES = {
    GUL: { name: 'Gül', image: 'gul.jpg', probability: 1 },
    LALE: { name: 'Lale', image: 'lale.jpg', probability: 1 },
    ORKIDE: { name: 'Orkide', image: 'orkide.jpg', probability: 1 },
    PAPATYA: { name: 'Papatya', image: 'papatya.jpg', probability: 1 },
    ZAMBAK: { name: 'Zambak', image: 'zambak.jpg', probability: 1 },
    MENEKSE: { name: 'Menekşe', image: 'menekse.jpg', probability: 1 },
    CAPELLA: { name: 'Capella', image: 'capella.jpg', probability: 1/30 }
};

// Büyüme aşamaları - RESİMLER KÖK DİZİNDE
const GROWTH_STAGES = {
    SEED: { name: 'Tohum', image: 'tohum.jpg', duration: 30000 }, // 30 saniye
    SPROUT: { name: 'Fidan', image: 'fidan.jpg', duration: 60000 }, // 1 dakika
    BUD: { name: 'Tomurcuk', image: 'tomurcuk.jpg', duration: 90000 }, // 1.5 dakika
    BLOOM: { name: 'Çiçek', image: null, duration: 0 } // Son aşama - kendi resmi
};

// Global değişkenler
let capellaCounter = 0;
let usedPositions = new Set();
const MAX_FLOWERS = 50;
let growthIntervals = {};

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('flowerField')) {
        initializeApp();
    }
});

function initializeApp() {
    const flowerModal = document.getElementById('flowerModal');
    const codeModal = document.getElementById('codeModal');
    const alertModal = document.getElementById('alertModal');
    const addFlowerBtn = document.getElementById('addFlowerBtn');
    const closeModal = document.getElementById('closeModal');
    const closeCodeModal = document.getElementById('closeCodeModal');
    const closeAlertModal = document.getElementById('closeAlertModal');
    const closeAlertBtn = document.getElementById('closeAlertBtn');
    const flowerForm = document.getElementById('flowerForm');
    const flowerField = document.getElementById('flowerField');
    
    // Tarla bilgi göstergesi ekle
    const tarlaInfo = document.createElement('div');
    tarlaInfo.className = 'tarla-info';
    tarlaInfo.innerHTML = 'Çiçekler: <span id="flowerCount">0</span>/' + MAX_FLOWERS;
    document.querySelector('.tarla-container').appendChild(tarlaInfo);

    // Modal event listeners
    addFlowerBtn.addEventListener('click', function() {
        updateFlowerCount();
        if (getCurrentFlowerCount() >= MAX_FLOWERS) {
            showAlert('Tarla doldu! 🌸<br>Yeni çiçek dikmek için mevcut çiçeklerin büyümesini bekleyin.');
            return;
        }
        flowerModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => flowerModal.style.display = 'none');
    closeCodeModal.addEventListener('click', () => codeModal.style.display = 'none');
    closeAlertModal.addEventListener('click', () => alertModal.style.display = 'none');
    closeAlertBtn.addEventListener('click', () => alertModal.style.display = 'none');

    window.addEventListener('click', function(event) {
        if (event.target === flowerModal) flowerModal.style.display = 'none';
        if (event.target === codeModal) codeModal.style.display = 'none';
        if (event.target === alertModal) alertModal.style.display = 'none';
    });

    // Form gönderimi
    flowerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userName = document.getElementById('userName').value;
        const code = document.getElementById('code').value;
        
        if (userName && code) {
            try {
                await addFlower(userName, code);
                flowerForm.reset();
                flowerModal.style.display = 'none';
            } catch (error) {
                alert('Hata oluştu: ' + error.message);
            }
        }
    });

    // Uygulamayı başlat
    renderFlowers();
    setupRealtimeListener();
    setupSmoothScroll();
}

// Rastgele çiçek türü seç
function getRandomFlowerType() {
    capellaCounter++;
    
    if (capellaCounter >= 30) {
        capellaCounter = 0;
        return FLOWER_TYPES.CAPELLA;
    }
    
    const commonFlowers = [
        FLOWER_TYPES.GUL, FLOWER_TYPES.LALE, FLOWER_TYPES.ORKIDE,
        FLOWER_TYPES.PAPATYA, FLOWER_TYPES.ZAMBAK, FLOWER_TYPES.MENEKSE
    ];
    
    const randomIndex = Math.floor(Math.random() * commonFlowers.length);
    return commonFlowers[randomIndex];
}

// Boş pozisyon bul
function getEmptyPosition() {
    const gridSize = 8;
    const positions = [];
    
    for (let x = 10; x <= 90; x += 10) {
        for (let y = 10; y <= 80; y += 10) {
            positions.push(`${x}-${y}`);
        }
    }
    
    const availablePositions = positions.filter(pos => !usedPositions.has(pos));
    
    if (availablePositions.length === 0) {
        return null;
    }
    
    const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    usedPositions.add(randomPos);
    
    const [x, y] = randomPos.split('-').map(Number);
    return { x, y };
}

// Mevcut büyüme aşamasını belirle
function getCurrentGrowthStage(flower) {
    const now = new Date().getTime();
    const plantedTime = flower.createdAt;
    const elapsed = now - plantedTime;
    
    if (elapsed >= GROWTH_STAGES.SEED.duration + GROWTH_STAGES.SPROUT.duration + GROWTH_STAGES.BUD.duration) {
        return { ...GROWTH_STAGES.BLOOM, image: flower.flowerType.image };
    } else if (elapsed >= GROWTH_STAGES.SEED.duration + GROWTH_STAGES.SPROUT.duration) {
        return GROWTH_STAGES.BUD;
    } else if (elapsed >= GROWTH_STAGES.SEED.duration) {
        return GROWTH_STAGES.SPROUT;
    } else {
        return GROWTH_STAGES.SEED;
    }
}

// Bir sonraki büyüme aşamasını hesapla
function getNextGrowthStage(flower) {
    const currentStage = getCurrentGrowthStage(flower);
    const now = new Date().getTime();
    const plantedTime = flower.createdAt;
    const elapsed = now - plantedTime;
    
    if (currentStage === GROWTH_STAGES.SEED) {
        const timeLeft = GROWTH_STAGES.SEED.duration - elapsed;
        return { stage: GROWTH_STAGES.SPROUT, timeLeft: Math.max(0, timeLeft) };
    } else if (currentStage === GROWTH_STAGES.SPROUT) {
        const timeLeft = GROWTH_STAGES.SEED.duration + GROWTH_STAGES.SPROUT.duration - elapsed;
        return { stage: GROWTH_STAGES.BUD, timeLeft: Math.max(0, timeLeft) };
    } else if (currentStage === GROWTH_STAGES.BUD) {
        const timeLeft = GROWTH_STAGES.SEED.duration + GROWTH_STAGES.SPROUT.duration + GROWTH_STAGES.BUD.duration - elapsed;
        return { stage: { ...GROWTH_STAGES.BLOOM, image: flower.flowerType.image }, timeLeft: Math.max(0, timeLeft) };
    } else {
        return { stage: currentStage, timeLeft: 0 };
    }
}

// Çiçek görseli oluştur
function createFlowerElement(flower) {
    const flowerElement = document.createElement('div');
    flowerElement.className = `flower ${flower.flowerType.name.toLowerCase()}`;
    flowerElement.dataset.id = flower.id;
    
    const position = getEmptyPosition();
    if (!position) {
        console.warn('Boş pozisyon bulunamadı');
        return null;
    }
    
    flowerElement.style.left = `${position.x}%`;
    flowerElement.style.top = `${position.y}%`;
    flowerElement.dataset.position = `${position.x}-${position.y}`;
    
    const isCapella = flower.flowerType === FLOWER_TYPES.CAPELLA;
    if (isCapella) {
        flowerElement.classList.add('capella');
    }
    
    const growthStage = getCurrentGrowthStage(flower);
    // RESİM YOLU KÖK DİZİNDE
    const imagePath = growthStage.image ? growthStage.image : flower.flowerType.image;
    
    const tooltipText = `${flower.userName} - ${flower.flowerType.name} - ${growthStage.name}${isCapella ? ' 🌟' : ''}`;
    
    flowerElement.innerHTML = `
        <img src="${imagePath}" alt="${flower.flowerType.name}" class="flower-image">
        <div class="flower-tooltip">${tooltipText}</div>
    `;
    
    flowerElement.addEventListener('click', () => showCode(flower));
    
    // Yeni çiçek efekti
    setTimeout(() => {
        flowerElement.classList.add('new-flower');
        setTimeout(() => {
            flowerElement.classList.remove('new-flower');
        }, 2000);
    }, 100);
    
    // Büyüme zamanlayıcısını başlat
    setupGrowthTimer(flower, flowerElement);
    
    return flowerElement;
}

// Büyüme zamanlayıcısını kur
function setupGrowthTimer(flower, flowerElement) {
    const nextGrowth = getNextGrowthStage(flower);
    
    if (nextGrowth.timeLeft > 0) {
        growthIntervals[flower.id] = setTimeout(() => {
            updateFlowerAppearance(flower, flowerElement);
        }, nextGrowth.timeLeft);
    }
}

// Çiçek görünümünü güncelle
function updateFlowerAppearance(flower, flowerElement) {
    const growthStage = getCurrentGrowthStage(flower);
    // RESİM YOLU KÖK DİZİNDE
    const imagePath = growthStage.image ? growthStage.image : flower.flowerType.image;
    
    const isCapella = flower.flowerType === FLOWER_TYPES.CAPELLA;
    const tooltipText = `${flower.userName} - ${flower.flowerType.name} - ${growthStage.name}${isCapella ? ' 🌟' : ''}`;
    
    flowerElement.innerHTML = `
        <img src="${imagePath}" alt="${flower.flowerType.name}" class="flower-image">
        <div class="flower-tooltip">${tooltipText}</div>
    `;
    
    // Yeni büyüme efekti
    flowerElement.classList.add('new-flower');
    setTimeout(() => {
        flowerElement.classList.remove('new-flower');
    }, 2000);
    
    // Sonraki büyüme için zamanlayıcıyı güncelle
    setupGrowthTimer(flower, flowerElement);
}

// Çiçek ekleme fonksiyonu
async function addFlower(userName, code) {
    const flowerType = getRandomFlowerType();
    
    const flower = {
        userName: userName,
        code: code,
        flowerType: flowerType,
        date: new Date().toLocaleDateString('tr-TR'),
        growthStage: 0,
        createdAt: new Date().getTime(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('flowers').add(flower);
    
    const message = flowerType === FLOWER_TYPES.CAPELLA ? 
        '🎉 Capella çiçeği dikildi! Bu nadir bir çiçek! 🌟' : 
        'Çiçeğin başarıyla dikildi! 🌱';
    
    showAlert(message);
}

// Çiçekleri render et
async function renderFlowers() {
    try {
        const snapshot = await db.collection('flowers')
            .orderBy('timestamp', 'desc')
            .get();
        
        const flowers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        const flowerField = document.getElementById('flowerField');
        flowerField.innerHTML = '';
        usedPositions.clear();
        
        Object.values(growthIntervals).forEach(interval => clearTimeout(interval));
        growthIntervals = {};
        
        if (flowers.length === 0) {
            flowerField.innerHTML = '<p class="no-flowers">Henüz hiç çiçek yok. İlk çiçeği sen dik!</p>';
            updateFlowerCount();
            return;
        }
        
        flowers.forEach(flower => {
            const flowerElement = createFlowerElement(flower);
            if (flowerElement) {
                flowerField.appendChild(flowerElement);
            }
        });
        
        updateFlowerCount();
        
    } catch (error) {
        console.error('Çiçekler yüklenirken hata:', error);
        const flowerField = document.getElementById('flowerField');
        flowerField.innerHTML = '<p class="error">Çiçekler yüklenirken hata oluştu.</p>';
    }
}

// Gerçek zamanlı dinleyici
function setupRealtimeListener() {
    db.collection('flowers')
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            console.log('Yeni çiçek eklendi!');
            renderFlowers();
        }, (error) => {
            console.error('Gerçek zamanlı dinleyici hatası:', error);
        });
}

// Çiçek sayısını güncelle
function updateFlowerCount() {
    const flowerCount = getCurrentFlowerCount();
    document.getElementById('flowerCount').textContent = flowerCount;
    
    if (flowerCount >= MAX_FLOWERS) {
        document.querySelector('.tarla-info').style.backgroundColor = '#FF6B6B';
        document.querySelector('.tarla-info').style.color = 'white';
    } else {
        document.querySelector('.tarla-info').style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        document.querySelector('.tarla-info').style.color = 'var(--text-color)';
    }
}

// Mevcut çiçek sayısını al
function getCurrentFlowerCount() {
    return document.querySelectorAll('.flower').length;
}

// Kod göster
function showCode(flower) {
    document.getElementById('codeAuthor').textContent = flower.userName;
    document.getElementById('codeDate').textContent = flower.date;
    document.getElementById('codeFlower').textContent = flower.flowerType.name;
    document.getElementById('codeDisplay').textContent = flower.code;
    
    const codeModal = document.getElementById('codeModal');
    codeModal.style.display = 'flex';
}

// Uyarı göster
function showAlert(message) {
    document.getElementById('alertMessage').innerHTML = message;
    const alertModal = document.getElementById('alertModal');
    alertModal.style.display = 'flex';
}

// Smooth scroll
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Sayfa kapatıldığında interval'ları temizle
window.addEventListener('beforeunload', function() {
    Object.values(growthIntervals).forEach(interval => clearTimeout(interval));
});
