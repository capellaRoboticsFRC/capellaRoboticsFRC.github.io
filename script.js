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
    
    // Analytics'i başlat (isteğe bağlı)
    const analytics = firebase.analytics();
    
} catch (error) {
    console.error("Firebase başlatma hatası:", error);
}

const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    // Modal elementleri
    const flowerModal = document.getElementById('flowerModal');
    const codeModal = document.getElementById('codeModal');
    const addFlowerBtn = document.getElementById('addFlowerBtn');
    const closeModal = document.getElementById('closeModal');
    const closeCodeModal = document.getElementById('closeCodeModal');
    const flowerForm = document.getElementById('flowerForm');
    const flowerField = document.getElementById('flowerField');
    
    // Yükleme göstergesi
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading';
    loadingIndicator.innerHTML = 'Çiçekler yükleniyor...';
    flowerField.appendChild(loadingIndicator);
    
    // Çiçek ekleme modalını aç
    addFlowerBtn.addEventListener('click', function() {
        flowerModal.style.display = 'flex';
    });
    
    // Modal kapatma işlevleri
    closeModal.addEventListener('click', function() {
        flowerModal.style.display = 'none';
    });
    
    closeCodeModal.addEventListener('click', function() {
        codeModal.style.display = 'none';
    });
    
    // Modal dışına tıklayınca kapat
    window.addEventListener('click', function(event) {
        if (event.target === flowerModal) {
            flowerModal.style.display = 'none';
        }
        if (event.target === codeModal) {
            codeModal.style.display = 'none';
        }
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
                alert('Çiçeğin başarıyla dikildi! 🌱');
            } catch (error) {
                alert('Hata oluştu: ' + error.message);
            }
        }
    });
    
    // Çiçek ekleme fonksiyonu (Firebase)
    async function addFlower(userName, code) {
        const flower = {
            userName: userName,
            code: code,
            date: new Date().toLocaleDateString('tr-TR'),
            growthStage: 0,
            createdAt: new Date().getTime(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Firebase'e kaydet
        await db.collection('flowers').add(flower);
        
        // Tarlayı yenile
        renderFlowers();
    }
    
    // Çiçek büyüme aşamalarını güncelle
    function updateGrowthStages(flowers) {
        const currentTime = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        
        return flowers.map(flower => {
            const daysPassed = Math.floor((currentTime - flower.createdAt) / oneDay);
            
            if (daysPassed >= 3) {
                flower.growthStage = 3;
            } else if (daysPassed >= 2) {
                flower.growthStage = 2;
            } else if (daysPassed >= 1) {
                flower.growthStage = 1;
            }
            
            return flower;
        });
    }
    
    // Çiçekleri Firebase'den al ve göster
    async function renderFlowers() {
        try {
            loadingIndicator.style.display = 'block';
            
            const snapshot = await db.collection('flowers')
                .orderBy('timestamp', 'desc')
                .get();
            
            const flowers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Büyüme aşamalarını güncelle
            const updatedFlowers = updateGrowthStages(flowers);
            
            // Tarlayı temizle
            flowerField.innerHTML = '';
            
            if (updatedFlowers.length === 0) {
                flowerField.innerHTML = '<p class="no-flowers">Henüz hiç çiçek yok. İlk çiçeği sen dik!</p>';
                return;
            }
            
            // Her çiçek için element oluştur
            updatedFlowers.forEach(flower => {
                const flowerElement = document.createElement('div');
                flowerElement.className = 'flower';
                flowerElement.dataset.id = flower.id;
                
                let flowerContent = '';
                let tooltipText = flower.userName;
                
                switch(flower.growthStage) {
                    case 0:
                        flowerContent = '<div class="seed"></div>';
                        tooltipText += ' - Tohum';
                        break;
                    case 1:
                        flowerContent = '<div class="sprout"></div>';
                        tooltipText += ' - Fidan';
                        break;
                    case 2:
                        flowerContent = '<div class="bud"></div>';
                        tooltipText += ' - Tomurcuk';
                        break;
                    case 3:
                        flowerContent = '<div class="flower-bloom"></div>';
                        tooltipText += ' - Çiçek';
                        break;
                }
                
                flowerElement.innerHTML = `
                    ${flowerContent}
                    <div class="flower-tooltip">${tooltipText}</div>
                `;
                
                flowerElement.addEventListener('click', function() {
                    showCode(flower);
                });
                
                flowerField.appendChild(flowerElement);
            });
            
        } catch (error) {
            console.error('Çiçekler yüklenirken hata:', error);
            flowerField.innerHTML = '<p class="error">Çiçekler yüklenirken hata oluştu.</p>';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }
    
    // Gerçek zamanlı güncelleme
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
    
    // Kodu göster
    function showCode(flower) {
        document.getElementById('codeAuthor').textContent = flower.userName;
        document.getElementById('codeDate').textContent = flower.date;
        document.getElementById('codeDisplay').textContent = flower.code;
        codeModal.style.display = 'flex';
    }
    
    // Sayfa yüklendiğinde çiçekleri yükle
    renderFlowers();
    setupRealtimeListener();
    
    // Smooth scroll
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
});