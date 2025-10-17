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

// Çiçek türleri - SIRALI DİZİ
const FLOWER_TYPES = [
    { name: 'Gül', image: 'gul.png', meaning: 'Aşk, Tutku, Cesaret' },
    { name: 'Lale', image: 'lale.png', meaning: 'Mükemmellik, Uyum' },
    { name: 'Orkide', image: 'orkide.png', meaning: 'Zarafet, Karmaşıklık' },
    { name: 'Papatya', image: 'papatya.png', meaning: 'Basitlik, Neşe' },
    { name: 'Zambak', image: 'zambak.png', meaning: 'Saflık, Dürüstlük' },
    { name: 'Menekşe', image: 'menekse.png', meaning: 'Alçakgönüllülük' }
];

const CAPELLA_FLOWER = { 
    name: 'Capella', 
    image: 'capella.png', 
    meaning: 'Nadirlik, Liderlik',
    isCapella: true 
};

// Büyüme aşamaları
const GROWTH_STAGES = {
    SEED: { name: 'Tohum', image: 'tohum.png', duration: 30000 },
    SPROUT: { name: 'Fidan', image: 'fidan.png', duration: 60000 },
    BUD: { name: 'Tomurcuk', image: 'tomurcuk.png', duration: 90000 },
    BLOOM: { name: 'Çiçek', image: null, duration: 0 }
};

// Global değişkenler
let flowerCounter = 0;
let usedPositions = new Set();
const MAX_FLOWERS = 30;
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
    
    // Modal event listeners
    addFlowerBtn.addEventListener('click', function() {
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

// Çiçek türünü sırayla seç - 30'DA BİR CAPELLA
function getSequentialFlowerType() {
    flowerCounter++;
    
    console.log(`Çiçek sayacı: ${flowerCounter}, 30'a bölümünden kalan: ${flowerCounter % 30}`);
    
    // 30'da bir Capella
    if (flowerCounter % 30 === 0) {
        console.log('🎉 Capella çiçeği seçildi!');
        return CAPELLA_FLOWER;
    }
    
    // Normal çiçekler sırayla
    const normalIndex = (flowerCounter - 1) % FLOWER_TYPES.length;
    const selectedFlower = FLOWER_TYPES[normalIndex];
    
    console.log(`Normal çiçek seçildi: ${selectedFlower.name}, index: ${normalIndex}`);
    
    return selectedFlower;
}

// Boş pozisyon bul
function getEmptyPosition() {
    const positions = [];
    
    for (let x = 5; x <= 90; x += 15) {
        for (let y = 5; y <= 85; y += 15) {
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
    
    const isCapella = flower.flowerType.isCapella || flower.flowerType.name === 'Capella';
    if (isCapella) {
        flowerElement.classList.add('capella');
    }
    
    const growthStage = getCurrentGrowthStage(flower);
    const imagePath = growthStage.image ? growthStage.image : flower.flowerType.image;
    
    const tooltipText = `${flower.userName}<br>${flower.flowerType.name} - ${growthStage.name}${isCapella ? ' 🌟' : ''}`;
    
    flowerElement.innerHTML = `
        <img src="${imagePath}" alt="${flower.flowerType.name}" class="flower-image" 
             onload="this.style.opacity='1'" 
             style="opacity:0; transition: opacity 0.3s ease;">
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
    const imagePath = growthStage.image ? growthStage.image : flower.flowerType.image;
    
    const isCapella = flower.flowerType.isCapella || flower.flowerType.name === 'Capella';
    const tooltipText = `${flower.userName}<br>${flower.flowerType.name} - ${growthStage.name}${isCapella ? ' 🌟' : ''}`;
    
    flowerElement.innerHTML = `
        <img src="${imagePath}" alt="${flower.flowerType.name}" class="flower-image" 
             onload="this.style.opacity='1'" 
             style="opacity:0; transition: opacity 0.3s ease;">
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
    const flowerType = getSequentialFlowerType();
    
    const flower = {
        userName: userName,
        code: code,
        flowerType: flowerType,
        date: new Date().toLocaleDateString('tr-TR'),
        growthStage: 0,
        createdAt: new Date().getTime(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        globalIndex: flowerCounter
    };
    
    try {
        await db.collection('flowers').add(flower);
        
        const message = flowerType.isCapella ? 
            '🎉 MÜTHİŞ! Capella çiçeği dikildi! 🌟<br>Bu nadir bir çiçek - 30 çiçekte bir görünür!' : 
            `🌱 ${flowerType.name} çiçeği dikildi!<br>Büyümesini izle...`;
        
        showAlert(message);
        
    } catch (error) {
        console.error('Çiçek ekleme hatası:', error);
        showAlert('Hata oluştu: ' + error.message);
        flowerCounter--;
    }
}

// Çiçekleri render et
async function renderFlowers() {
    try {
        const snapshot = await db.collection('flowers')
            .orderBy('timestamp', 'asc')
            .get();
        
        const flowers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Global sayacı güncelle
        if (flowers.length > 0) {
            const lastFlower = flowers[flowers.length - 1];
            flowerCounter = lastFlower.globalIndex || flowers.length;
            console.log(`Global çiçek sayacı güncellendi: ${flowerCounter}`);
        } else {
            flowerCounter = 0;
        }
        
        const flowerField = document.getElementById('flowerField');
        flowerField.innerHTML = '';
        usedPositions.clear();
        
        Object.values(growthIntervals).forEach(interval => clearTimeout(interval));
        growthIntervals = {};
        
        if (flowers.length === 0) {
            flowerField.innerHTML = `
                <div class="no-flowers">
                    <h3>Henüz hiç çiçek yok</h3>
                    <p>İlk çiçeği sen dik ve tarlayı renklendir! 🌸</p>
                </div>
            `;
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
        flowerField.innerHTML = `
            <div class="error">
                <h3>Hata oluştu</h3>
                <p>Çiçekler yüklenirken bir sorun oluştu.</p>
            </div>
        `;
    }
}

// Gerçek zamanlı dinleyici
function setupRealtimeListener() {
    db.collection('flowers')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            console.log('Yeni çiçek eklendi!');
            renderFlowers();
        }, (error) => {
            console.error('Gerçek zamanlı dinleyici hatası:', error);
        });
}

// Çiçek sayısını güncelle
function updateFlowerCount() {
    const currentFlowers = getCurrentFlowerCount();
    const nextCapella = 30 - (flowerCounter % 30);
    
    const tarlaInfo = document.querySelector('.tarla-info');
    if (tarlaInfo) {
        tarlaInfo.innerHTML = `
            🌸 Çiçekler: ${currentFlowers}/${MAX_FLOWERS}<br>
            🎯 Sonraki Capella: ${nextCapella}. çiçekte
        `;
        
        // Renk kodları
        if (currentFlowers >= MAX_FLOWERS) {
            tarlaInfo.style.backgroundColor = '#FF6B6B';
            tarlaInfo.style.color = 'white';
            tarlaInfo.style.borderColor = '#FF4757';
        } else if (currentFlowers >= MAX_FLOWERS * 0.8) {
            tarlaInfo.style.backgroundColor = '#FFA502';
            tarlaInfo.style.color = 'white';
            tarlaInfo.style.borderColor = '#FF7F00';
        } else {
            tarlaInfo.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            tarlaInfo.style.color = 'var(--text-color)';
            tarlaInfo.style.borderColor = 'var(--accent-color)';
        }
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
    document.getElementById('codeFlower').textContent = `${flower.flowerType.name} - ${flower.flowerType.meaning || 'Anlamı bulunamadı'}`;
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
