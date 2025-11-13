document.addEventListener('DOMContentLoaded', () => {
    // A ação de adicionar ao carrinho será tratada pelo bloco jQuery abaixo (mantido separado para clareza)

    // Validação do E-mail da Newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const emailInput = newsletterForm.querySelector('.newsletter-input');
            const email = emailInput.value;

            if (validateEmail(email)) {
                alert('Inscrição na newsletter realizada com sucesso!');
                // Aqui você pode adicionar lógica para enviar o e-mail para o servidor
                emailInput.value = ''; // Limpa o campo após o envio
            } else {
                alert('Por favor, insira um endereço de e-mail válido.');
            }
        });
    }

    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // Filtro de Busca Dinâmico para Produtos
    const searchInput = document.querySelector('.search-input');
    const productList = document.querySelector('.product-list');

    if (searchInput && productList) {
        searchInput.addEventListener('keyup', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const products = productList.querySelectorAll('.product-item');
            console.log('Search Term:', searchTerm);

            products.forEach(product => {
                const productName = product.querySelector('.product-title').textContent.toLowerCase();
                if (productName.includes(searchTerm)) {
                    product.style.visibility = 'visible'; // Mostra o produto
                    product.style.position = 'static'; // Garante que ocupe espaço
                } else {
                    product.style.visibility = 'hidden'; // Esconde o produto
                    product.style.position = 'absolute'; // Remove do fluxo do documento
                }
            });
        });
    }
});

/* ======= Bloco mínimo jQuery para carrinho (adicionar / renderizar / remover / alterar qtd) ======= */
/* Isso é propositalmente pequeno e separado: não reescreve o código existente, só implementa o carrinho com jQuery. */
$(function() {
    function getCart() {
        try { return JSON.parse(localStorage.getItem('cart') || '[]'); }
        catch (e) { return []; }
    }
    function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }

    function formatPrice(num) {
        return Number(num || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    const showToast = (message) => {
        const $toast = $('#toast-message');
        if ($toast.length === 0) {
            // Se o toast não existir, não faz nada (poderia criar, mas mantemos simples)
            console.warn("Elemento #toast-message não encontrado. O alert() foi removido.");
            return;
        }
        $toast.text(message).fadeIn(400);
        setTimeout(() => {
            $toast.fadeOut(400);
        }, 3000); // A mensagem desaparece após 3 segundos
    };


    function renderCart() {
        var $container = $('#cart-items');
        if ($container.length === 0) return; // não estamos na página de carrinho
        var cart = getCart();
        $container.empty();
        if (!cart || cart.length === 0) {
            $('#empty-cart-message').removeClass('d-none');
            $('#subtotal-value').text(formatPrice(0));
            $('#total-value').text(formatPrice(0));
            return;
        }
        $('#empty-cart-message').addClass('d-none');
        cart.forEach(function(item) {
            var line = item.price * item.qty;
            var $art = $('<article class="cart-item card mb-3" data-id="'+item.id+'">' +
                '<section class="card-body"><section class="d-flex justify-content-between">' +
                '<section class="d-flex flex-row align-items-center">' +
                '<figure class="me-3 mb-0"><img src="'+item.img+'" class="img-fluid rounded-3" alt="'+item.title+'" style="width:65px"></figure>' +
                '<section><h3 class="h6 mb-0">'+item.title+'</h3></section>' +
                '</section>' +
                '<section class="d-flex flex-row align-items-center">' +
                '<section style="width:120px" class="d-flex align-items-center">' +
                '<button class="btn btn-link px-2 btn-minus">-</button>' +
                '<input type="number" min="1" value="'+item.qty+'" class="form-control form-control-sm text-center qty-input" style="width:60px">' +
                '<button class="btn btn-link px-2 btn-plus">+</button>' +
                '</section>' +
                '<section style="width:120px; text-align:right"><p class="mb-0 fw-bold line-total">'+formatPrice(line)+'</p></section>' +
                '<a href="#" class="text-danger ms-3 remove-item">Remover</a>' +
                '</section></section></section></article>');
            $container.append($art);
        });
        bindCartEvents();
        updateTotals();
    }

    function updateTotals() {
        var cart = getCart();
        var subtotal = 0;
        cart.forEach(function(i){ subtotal += i.price * i.qty; });
        $('#subtotal-value').text(formatPrice(subtotal));
        $('#total-value').text(formatPrice(subtotal));
    }

    function bindCartEvents() {
        $('.remove-item').off('click').on('click', function(e){
            e.preventDefault();
            var id = $(this).closest('.cart-item').data('id');
            var cart = getCart().filter(function(it){ return it.id !== id; });
            saveCart(cart);
            renderCart();
        });
        $('.qty-input').off('change').on('change', function(){
            var $inp = $(this);
            var qty = parseInt($inp.val(),10) || 1;
            if (qty < 1) qty = 1; $inp.val(qty);
            var id = $inp.closest('.cart-item').data('id');
            var cart = getCart().map(function(it){ if (it.id === id) it.qty = qty; return it; });
            saveCart(cart);
            // atualizar linha
            var item = cart.find(function(it){ return it.id === id; });
            if (item) $inp.closest('.cart-item').find('.line-total').text(formatPrice(item.price * item.qty));
            updateTotals();
        });
        $('.btn-plus').off('click').on('click', function(){
            var $inp = $(this).siblings('.qty-input');
            $inp.val( (parseInt($inp.val(),10)||0) + 1 ).trigger('change');
        });
        $('.btn-minus').off('click').on('click', function(){
            var $inp = $(this).siblings('.qty-input');
            var cur = parseInt($inp.val(),10) || 1; if (cur>1) $inp.val(cur-1).trigger('change');
        });
    }

    // Adicionar ao carrinho (qualquer página)
    $(document).on('click', '.add-to-cart', function(e){
        e.preventDefault();
        var $prod = $(this).closest('.product-item');
        var title = $prod.find('.product-title').text().trim();
        var priceText = $prod.find('.product-price').text().trim();
        // parse simples: remove tudo que não seja digito ou vírgula/ponto
        var cleaned = (priceText||'').replace(/[^0-9,.-]+/g,'').replace('.', '').replace(',', '.');
        var price = parseFloat(cleaned) || 0;
        var img = $prod.find('img').attr('src') || '';
        var id = $prod.data('id') || title.replace(/\s+/g,'-').toLowerCase();
        var cart = getCart();
        var found = cart.find(function(it){ return it.id === id; });
        if (found) found.qty = (found.qty||1) + 1; else cart.push({ id:id, title:title, price:price, img:img, qty:1 });
        saveCart(cart);
        // Se estivermos na página do carrinho, re-renderiza
        renderCart();
        // Substituímos o alert()
        showToast('Produto adicionado ao carrinho!');
    });

    // Adiciona o elemento do "toast" ao body (para substituir o alert)
    $('body').append('<div id="toast-message"></div>');

    // renderiza ao carregar a página (aplica somente se existir o #cart-items)
    renderCart();
});