function runCode() {
    let code = document.getElementById("codeInput").value;

    try {
        eval(code);

        if (typeof growFlower === "function") {
            let result = growFlower();

            if (result === true) {
                plantFlower();
            }
        }
    } catch (e) {
        alert("Kodda hata var! Örnek: function growFlower(){ return true; }");
    }
}

function plantFlower() {
    // Çiçek resimleri - kendi dosyalarınızla uyumlu
    const flowers = [
        { name: "menekse", img: "menekse.png" },
        { name: "lale", img: "lale.png" },
        { name: "gul", img: "gul.png" },
        { name: "capella", img: "capella.png" },
        { name: "papatya", img: "papatya.png" },
        { name: "orkide", img: "orkide.png" },
        { name: "zambak", img: "zambak.png" }
    ];

    // Rastgele bir çiçek seç
    const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];

    // Çiçek için div oluştur
    let flowerDiv = document.createElement("div");
    flowerDiv.className = "flower";

    // İçine resim ekle
    let img = document.createElement("img");
    img.src = randomFlower.img;
    img.alt = randomFlower.name;
    img.style.width = "55px";
    img.style.height = "55px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "50%";
    img.style.boxShadow = "0 4px 10px rgba(0,0,0,0.25)";
    img.style.border = "3px solid #ffd700";
    img.style.cursor = "pointer";

    // Resme tıklayınca büyüme efekti
    img.addEventListener("click", function(e) {
        e.stopPropagation();
        this.style.transform = "scale(1.2)";
        setTimeout(() => {
            this.style.transform = "scale(1)";
        }, 200);
    });

    flowerDiv.appendChild(img);

    // Tarla alanını al
    let field = document.getElementById("field");

    // Rastgele pozisyon hesapla
    const maxX = field.clientWidth - 70;
    const maxY = field.clientHeight - 70;

    let leftPos = Math.random() * maxX;
    let topPos = Math.random() * maxY;

    leftPos = Math.max(5, Math.min(leftPos, maxX));
    topPos = Math.max(5, Math.min(topPos, maxY));

    flowerDiv.style.left = leftPos + "px";
    flowerDiv.style.top = topPos + "px";

    // Sağ tıklama ile silme (isteğe bağlı)
    flowerDiv.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        if (confirm("Bu çiçeği sökmek istediğine emin misin? 🌸")) {
            this.remove();
        }
    });

    field.appendChild(flowerDiv);
}
