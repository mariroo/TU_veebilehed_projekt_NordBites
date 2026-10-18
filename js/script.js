/* =========================================================
   NORDICBITES:  NÄIDIS-E-POOD
   =========================================================
   1. Toodete andmed
   2. Ostukorvi andmete salvestamine ja arvutused
   3. Tootekaartide loomine ja kuvamine
   4. Tellimuse kokkuvõtte kuvamine
   5. Nuppude ja filtrite sündmused
   6. Otsing
   7. Tellimuse kinnitamine
   8. Veebilehe käivitamine

   Ostukorvi andmed salvestatakse kasutaja brauserisse.
   Päris tellimust pagarikotta ei saadeta.
*/

/* =========================================================
   1. TOODETE ANDMED
   ========================================================= */

// Massiiv, mis sisaldab kõiki müüdavaid tooteid.
// Iga toode on objekt, millel on oma omadused.

const products = [
    {
        id: "kardemonisai",
        name: "Kardemonisai",
        price: 3.2,
        allergens: "Gluteen, laktoos",
        category: "saiakesed",
        image: "images/kardemonisai.jpg",
        flag: "POPULAARNE"
    },
    {
        id: "haputaignaleib",
        name: "Haputaignaleib",
        price: 4.5,
        allergens: "Gluteen",
        category: "leivad",
        image: "images/haputaignaleib.jpg"
    },
    {
        id: "mandlicroissant",
        name: "Mandlicroissant",
        price: 3.8,
        allergens: "Gluteen, laktoos, pähklid",
        category: "saiakesed",
        image: "images/mandlicroissant.jpg"
    },
    {
        id: "kaneelirull",
        name: "Kaneelirull",
        price: 2.9,
        allergens: "Gluteen, laktoos",
        category: "saiakesed",
        image: "images/kaneelirull.jpg"
    },
    {
        id: "rukkileib",
        name: "Rukkileib",
        price: 4.2,
        allergens: "Gluteen",
        category: "leivad",
        image: "images/rukkileib.jpg",
        flag: "UUS"
    },
    {
        id: "kohv",
        name: "Käsitöökohv (Flat White)",
        price: 3.5,
        allergens: "Laktoos",
        category: "joogid",
        image: "images/kohv.jpg"
    }
];

/* =========================================================
   2. OSTUKORV – ANDMED JA ARVUTUSED
   ========================================================= */

// Võtmenimi, mille all salvestatakse ostukorv brauserisse.
const CART_KEY = "nordicbites-cart";

// fn loeb ostukorvi andmed brauseri localStorage'ist.
// JSON.parse muudab salvestatud teksti tagasi JS objektiks.
// Kui andmeid pole või need on vigased, tagastatakse tühi objekt {}.

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || {};
    } catch (error) {
        return {};
    }
}


// fn salvestab ostukorvi brauserisse.
// JSON.stringify muudab JS objekti salvestatavaks tekstiks.
// Pärast salvestamist uuendatakse ostukorvi kuvamist.
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    refreshCart();
    // Uuendab ka tootekaartide valiku märgistuse.
    renderProducts();
}

// fn vormindab hinna kahe komakohaga (3.2 -> "3.20€)".
function money(value) {
    return Number(value).toFixed(2) + " €";
}

// fn arvutab ostukorvis olevate toodete koguarvu.
// Object.values(cart) võtab ostukorvist kõik kogused.
// reduce liidab need kokku.
function countCart(cart) {
    return Object.values(cart).reduce(function (total, qty) {
        return total + qty;
    }, 0);
}

// fn arvutab ostukorvi kogumaksumuse.
// Käib läbi kõik tooted ning korrutab hinna kogusega.
// Kui toodet ostukorvis pole, kasutatakse kogust 0.
function totalCart(cart) {
    return products.reduce(function (total, product) {
        return total + (cart[product.id] || 0) * product.price;
    }, 0);
}

// fn lisab valitud toote ostukorvi.
// Kui toode on juba korvis, suurendatakse kogust ühe võrra.
function addToCart(id) {
    const cart = getCart();

    cart[id] = (cart[id] || 0) + 1;

    saveCart(cart);
}


// fn muudab ostukorvis oleva toote kogust.
// change = 1 suurendab kogust, change = -1 vähendab.
// Math.max ei lase kogusel muutuda negatiivseks.
// Kui kogus muutub 0ks, eemaldatakse toode ostukorvist.

function updateQty(id, change) {
    const cart = getCart();

    cart[id] = Math.max(0, (cart[id] || 0) + change);

    if (!cart[id]) {
        delete cart[id];
    }

    saveCart(cart);
}


// fn uuendab ostukorvi infot kõigil lehtedel:
// 1. Päises olevat toodete arvu
// 2. Tootekataloogi alumist rohelist ostukorviriba
// 3. Tellimuse kokkuvõtet, kui ollakse checkout.html lehel

function refreshCart() {
    const cart = getCart();
    const count = countCart(cart);
    const total = money(totalCart(cart));

    // Uuendab kõiki HTML-elemente, millel on data-cart-count.
    document.querySelectorAll("[data-cart-count]").forEach(function (node) {
        node.textContent = count;
    });

    // Otsib tootekataloogi alumise rohelise ostukorviriba.
    const strip = document.querySelector(".cart-strip");

    if (strip) {
        // Kui ostukorvis on 0 toodet, peidetakse riba.
        // Kui ostukorvis on vähemalt 1 toode, kuvatakse riba.
        strip.hidden = count === 0;

        // Otsib ribalt ostukorvi kokkuvõtte teksti.
        const text = strip.querySelector("[data-cart-summary]");

        if (text) {
            text.textContent =
                "Ostukorvis on " + count + " toodet (" + total + ")";
        }
    }

    // Kui ollakse tellimuse lehel, uuendatakse ka kokkuvõtet.
    if (document.getElementById("checkout-items")) {
        renderCheckout();
    }
}


/* =========================================================
   3. TOOTEKAARTIDE LOOMINE JA KUVAMINE
   ========================================================= */

// fn koostab ühe toote HTML-kaardi.
// product = toote andmeid sisaldav objekt.
// recommendations = true, kui kaart kuvatakse avalehel;
// false, kui kaart kuvatakse tootekataloogis.
//
// Avalehel on nupp "Telli kohe".
// Tootekataloogis on ümmargune "+" nupp.

function cardHTML(product, recommendations) {
    // Kontrollib, kas toodet on ostukorvis vähemalt üks.
    // Roheline raam ja VALITUD silt kuvatakse ainult kataloogis.
    const selected = !recommendations && (getCart()[product.id] || 0) > 0;

    return (
        '<article class="product-card' + (selected ? ' product-selected' : '') + '">' +
            '<div class="product-image">' +
                '<img src="' + product.image +
                '" alt="' + product.name + '">' +

                // Lisab POPULAARNE või UUS sildi, kui tootel see on.
                (product.flag
                    ? '<span class="flag">' + product.flag + '</span>'
                    : '') +

                // VALITUD lisatakse eraldi sildina: POPULAARNE või UUS jääb alles.
                (selected ? '<span class="selected-flag' +
                    (product.flag ? ' below-flag' : '') + '">VALITUD</span>' : '') +

            '</div>' +

            '<div class="product-content">' +

                '<h3>' + product.name + '</h3>' +

                '<p>' +
                    (recommendations ? 'Allergeenid: ' : 'Sisaldab: ') +
                    product.allergens +
                '</p>' +

            '</div>' +

            '<div class="product-bottom">' +

                '<span class="price">' +
                    money(product.price) +
                '</span>' +

                '<button type="button" class="add-button' +
                    (recommendations ? '' : ' circle') +

                    '" data-add="' + product.id +

                    '" aria-label="Lisa ' + product.name +
                    ' ostukorvi">' +

                    (recommendations ? 'Telli kohe' : '+') +

                '</button>' +

            '</div>' +

        '</article>'
    );
}


// Muutujad tootekataloogi filtreerimiseks.
// Alguses kuvatakse kõik kategooriad ja otsingutekst on tühi.
let activeCategory = "all";
let searchTerm = "";


// fn kuvab tooted HTML-lehele.
// Avalehel kuvatakse kolm soovitatud toodet.
// Kataloogis kuvatakse kõik tooted või filtreeritud valik.
function renderProducts() {

    // AVALEHE SOOVITATUD TOOTED
    // Otsib avalehe HTML-ist soovitatud toodete konteineri.
    const recommendations = document.getElementById("recommendations-grid");

    if (recommendations) {
        // slice(0, 3) valib toodete massiivist esimesed 3 toodet.
        // map loob iga toote jaoks HTML-kaardi.
        // join ühendab kaardid üheks HTML-tekstiks.
        recommendations.innerHTML = products
            .slice(0, 3)
            .map(function (p) {
                return cardHTML(p, true);
            })
            .join("");
    }


    // TOOTEKATALOOG

    // Otsib tooted.html failist tootekataloogi konteineri.
    const catalog = document.getElementById("catalog-grid");

    if (catalog) {
        // filter valib ainult sobivad tooted.
        // Kontrollitakse nii valitud kategooriat kui ka otsinguteksti.
        const shown = products.filter(function (p) {
            return (
                (activeCategory === "all" || p.category === activeCategory) &&
                p.name.toLocaleLowerCase("et").includes(searchTerm)
            );
        });

        // Kui tooteid leidub, luuakse neist HTML-kaardid.
        // Kui sobivaid tooteid pole, kuvatakse teade.
        catalog.innerHTML = shown.length
            ? shown
                .map(function (p) {
                    return cardHTML(p, false);
                })
                .join("")
            : '<p class="empty">Otsingule vastavaid tooteid ei leitud.</p>';
    }
}


/* =========================================================
   4. TELLIMUSE KOKKUVÕTE – CHECKOUT.HTML
   ========================================================= */

// fn kuvab ostukorvi sisu tellimuse vormistamise lehel.
// Iga ostukorvis oleva toote kohta luuakse kokkuvõtte rida.
// Kasutaja saab toote kogust suurendada ja vähendada.

function renderCheckout() {

    // Otsib HTML-ist ostukorvi toodete konteineri.
    const el = document.getElementById("checkout-items");

    // Kui seda elementi lehel pole, lõpetatakse fn.
    if (!el) {
        return;
    }

    const cart = getCart();

    // Valib ainult need tooted, mille kogus ostukorvis on üle 0.
    const selected = products.filter(function (p) {
        return cart[p.id] > 0;
    });


    // Loob iga ostukorvis oleva toote kohta HTML-rea.
    // Kui ostukorv on tühi, kuvatakse vastav teade.

    el.innerHTML = selected.length
        ? selected
            .map(function (p) {

                return (
                    '<div class="summary-item">' +

                        '<img src="' + p.image + '" alt="">' +

                        '<div>' +

                            '<div class="item-name">' +
                                p.name +
                            '</div>' +

                            '<div class="item-qty">Kogus: ' +
                                cart[p.id] +
                            '</div>' +

                            // Nupud toote koguse muutmiseks.
                            '<div class="qty-control">' +

                                '<button type="button" data-qty="-1" data-id="' +
                                    p.id +
                                    '" aria-label="Vähenda kogust">−</button>' +

                                '<span>' + cart[p.id] + '</span>' +

                                '<button type="button" data-qty="1" data-id="' +
                                    p.id +
                                    '" aria-label="Suurenda kogust">+</button>' +

                            '</div>' +

                        '</div>' +

                        '<strong>' +
                            money(p.price * cart[p.id]) +
                        '</strong>' +

                    '</div>'
                );
            })
            .join("")

        : '<p class="empty">Ostukorv on tühi. ' +
          '<a href="tooted.html" style="color:var(--green);text-decoration:underline">' +
          'Vali tooteid</a>.</p>';


    // Uuendab tellimuse vahesummat ja lõppsummat.
    // Mõlemad on selles projektis võrdsed,
    // sest pakendi eest lisatasu ei arvestata.

    document.querySelectorAll("[data-subtotal], [data-total]")
        .forEach(function (node) {
            node.textContent = money(totalCart(cart));
        });


    // Kui ostukorv on tühi, ei saa tellimust kinnitada.
    const submit = document.getElementById("place-order");

    if (submit) {
        submit.disabled = selected.length === 0;
    }
}


/* =========================================================
   5. NUPPUDE JA FILTRITE KLIKISÜNDMUSED
   ========================================================= */

// addEventListener jälgib kasutaja klikke kogu dokumendis.
// event.target näitab, millisele elemendile klikiti.
// closest otsib klikitud elemendist või selle ümbert sobivat elementi.
//
// Kuna tootekaardid luuakse JS-iga, saab sellisel viisil
// ka dünaamiliselt loodud nuppude klikke töödelda.

document.addEventListener("click", function (event) {
    // 5.1 TOOTE LISAMINE OSTUKORVI

    // Otsib, kas klikiti data-add atribuudiga nuppu.
    const add = event.target.closest("[data-add]");

    if (add) {
    const productId = add.dataset.add;

    // Avalehel: kõigepealt nupu animatsioon
    if (document.getElementById("recommendations-grid")) {
        add.classList.add("clicked");
        // Lisab toote ostukorvi pärast animatsiooni
        setTimeout(function () {
            addToCart(productId);
            add.classList.remove("clicked");
        }, 400);
    } else {
        // Tootekataloogis lisab toote kohe
        addToCart(productId);
    }
    return;
}
    
  

    // 5.2 TOOTE KOGUSE MUUTMINE

    // Otsib, kas klikiti + või − kogusenupule.
    const qty = event.target.closest("[data-qty]");

    if (qty) {
        // dataset.id = toote ID.
        // dataset.qty = koguse muudatus (+1 või -1).
        updateQty(qty.dataset.id, Number(qty.dataset.qty));
        return;
    }


    // 5.3 TOOTEKATEGOORIA FILTREERIMINE

    // Otsib, kas klikiti kategooriafiltri nupule.
    const filter = event.target.closest("[data-category]");

    if (filter) {
        // Salvestab valitud kategooria.
        activeCategory = filter.dataset.category;

        // Eemaldab selected klassi teistelt nuppudelt
        // ja lisab selle klikitud nupule.
        document.querySelectorAll("[data-category]")
            .forEach(function (button) {
                button.classList.toggle("selected", button === filter);
            });

        // Kuvab valitud kategooria tooted uuesti.
        renderProducts();
        return;
    }


    // 5.4 OTSINGUVÄLJA AVAMINE JA SULGEMINE
    // OTSINGUNUPP
    if (event.target.closest("#search-toggle")) {
        // Kui kasutaja pole tootekataloogis, suuname ta sinna.
        if (!document.getElementById("catalog-grid")) {
            window.location.href = "tooted.html#otsi";
            return;
        }
        // Tootekataloogis avame või sulgeme otsingukasti.
        const bar = document.getElementById("search-bar");
        bar.classList.toggle("open");

        if (bar.classList.contains("open")) {
            bar.querySelector("input").focus();
        }

        return;
    }

    


    // 5.5 MOBIILIMENÜÜ AVAMINE JA SULGEMINE

    if (event.target.closest("#menu-toggle")) {

        // Klass open määrab CSS-is menüü nähtavuse.
        document.getElementById("main-nav").classList.toggle("open");
    }

});


/* =========================================================
   6. TOODETE OTSING
   ========================================================= */

// Otsib HTML-ist otsinguvälja.
const searchInput = document.getElementById("product-search");

if (searchInput) {
    // input-sündmus käivitub iga kord, kui kasutaja teksti muudab.
    searchInput.addEventListener("input", function () {
        // trim eemaldab liigsed tühikud teksti algusest ja lõpust.
        // toLocaleLowerCase teisendab teksti väiketähtedeks.
        searchTerm = searchInput.value.trim().toLocaleLowerCase("et");
        // Kuvab otsingule vastavad tooted.
        renderProducts();
    });
}


/* =========================================================
   7. TELLIMUSE KINNITAMINE
   ========================================================= */

// Otsib checkout.html failist tellimuse vormi.
const orderForm = document.getElementById("order-form");

if (orderForm) {

    // submit-sündmus käivitub vormi esitamisel.
    orderForm.addEventListener("submit", function (event) {

        // Takistab vormi tavapärast saatmist ja lehe uuesti laadimist.
        event.preventDefault();

        // Kontrollib vormiväljade korrektsust ja ostukorvi sisu.
        // Kui vorm pole korrektne või korv on tühi, lõpetatakse töö.
        if (!orderForm.reportValidity() || countCart(getCart()) === 0) {
            return;
        }

        // Loeb vormist kasutaja eesnime.
        const firstName = document.getElementById("first-name").value.trim();

        // Otsib HTML-ist tellimuse kinnitusteate elemendi.
        const message = document.getElementById("order-message");

        // Koostab kasutajale kuvatava kinnitusteksti.
        message.textContent =
            "Aitäh, " +
            firstName +
            "! Tellimus on vormistatud. ";

        // Muudab kinnitusteate nähtavaks.
        message.hidden = false;

        // Tühjendab ostukorvi.
        saveCart({});

        // Tühjendab vormiväljad.
        orderForm.reset();

        // Kerib sujuvalt kinnitusteate juurde.
        message.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });
}


/* =========================================================
   8. VEEBILEHE KÄIVITAMINE
   ========================================================= */
// Kuvab veebilehe avamisel tooted.
renderProducts();
// Loeb brauserist ostukorvi andmed ja uuendab ostukorvi kuvamist.
refreshCart();




