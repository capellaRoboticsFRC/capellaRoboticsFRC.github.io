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
    // Çiçek resimlerinin URL'leri
    const flowers = [
        { name: "papatya", img: "https://cdn.pixabay.com/photo/2018/05/27/21/17/daisy-3434562_640.jpg" },
        { name: "aycicegi", img: "https://cdn.pixabay.com/photo/2016/08/13/17/53/sunflower-1591296_640.jpg" },
        { name: "lale", img: "https://cdn.pixabay.com/photo/2014/04/14/20/11/tulips-324175_640.jpg" },
        { name: "gul", img: "https://cdn.pixabay.com/photo/2018/04/05/22/05/rose-3293922_640.jpg" },
        { name: "lavanta", img: "https://cdn.pixabay.com/photo/2018/06/25/20/47/lavender-3498288_640.jpg" },
        { name: "hibiskus", img: "https://cdn.pixabay.com/photo/2018/01/22/14/16/hibiscus-3098951_640.jpg" },
        { name: "kiraz", img: "https://cdn.pixabay.com/photo/2016/04/15/13/59/cherry-blossom-1331322_640.jpg" },
        { name: "capella", img: "https://cdn.pixabay.com/photo/2020/04/06/11/50/magic-flower-5009889_640.jpg" }
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

    // Rastgele pozisyon hesapla (tarla sınırları içinde)
    const maxX = field.clientWidth - 70;
    const maxY = field.clientHeight - 70;

    let leftPos = Math.random() * maxX;
    let topPos = Math.random() * maxY;

    // Taşma olmaması için sınırlama
    leftPos = Math.max(5, Math.min(leftPos, maxX));
    topPos = Math.max(5, Math.min(topPos, maxY));

    flowerDiv.style.left = leftPos + "px";
    flowerDiv.style.top = topPos + "px";

    // Çiçeğe sağ tıklayınca silme (isteğe bağlı)
    flowerDiv.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        if (confirm("Bu çiçeği sökmek istediğine emin misin? 🌸")) {
            this.remove();
        }
    });

    field.appendChild(flowerDiv);
}
