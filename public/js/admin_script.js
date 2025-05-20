document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES PARA CONTROLE DE DISPONIBILIDADE ---
    const itemsContainer = document.getElementById('itemsContainer');
    const saveAvailabilityButton = document.getElementById('saveAvailabilityButton');
    const availabilityStatusMessage = document.getElementById('availabilityStatusMessage');
    let currentItemsData = {};

    // --- LÓGICA DE DISPONIBILIDADE ---
    async function fetchItemsAvailability() {
        if (!itemsContainer) return;
        itemsContainer.innerHTML = '<p>Carregando itens para controle de disponibilidade...</p>';
        try {
            const response = await fetch('/api/items');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            currentItemsData = await response.json();
            renderItemsAvailability();
        } catch (error) {
            console.error('Erro ao buscar itens para disponibilidade:', error);
            if (availabilityStatusMessage) {
                availabilityStatusMessage.textContent = 'Erro ao carregar itens para disponibilidade.';
                availabilityStatusMessage.style.color = 'red';
            }
            if (itemsContainer) itemsContainer.innerHTML = '<p>Erro ao carregar itens.</p>';
        }
    }

    function renderItemsAvailability() {
        if (!itemsContainer) return;
        itemsContainer.innerHTML = '';

        for (const categoryKey in currentItemsData) {
            if (Object.hasOwnProperty.call(currentItemsData, categoryKey)) {
                const categoryItemsArray = currentItemsData[categoryKey];
                if (!Array.isArray(categoryItemsArray) || categoryItemsArray.length === 0) continue;

                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'category-admin';

                const categoryTitleElement = document.createElement('h3');
                // Formata o nome da categoria para exibição (ex: "produtos_especiais" vira "Produtos Especiais")
                categoryTitleElement.textContent = categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                categoryDiv.appendChild(categoryTitleElement);

                if (categoryKey === 'produtos_especiais') {
                    categoryItemsArray.forEach(specialProduct => {
                        // Controle para o produto especial principal (ex: Copo da Felicidade em si)
                        const productControlDiv = document.createElement('div');
                        productControlDiv.className = 'item-control-admin';

                        const productCheckbox = document.createElement('input');
                        productCheckbox.type = 'checkbox';
                        productCheckbox.id = `item-avail-${specialProduct.id}`;
                        productCheckbox.checked = specialProduct.available;
                        productCheckbox.dataset.category = categoryKey;
                        productCheckbox.dataset.itemId = specialProduct.id;

                        const productLabel = document.createElement('label');
                        productLabel.textContent = `${specialProduct.name} (Produto Principal)`;
                        productLabel.htmlFor = `item-avail-${specialProduct.id}`;

                        productControlDiv.appendChild(productCheckbox);
                        productControlDiv.appendChild(productLabel);
                        categoryDiv.appendChild(productControlDiv);

                        // Se o produto especial tiver sabores (ex: Copo da Felicidade)
                        if (specialProduct.flavors && Array.isArray(specialProduct.flavors) && specialProduct.flavors.length > 0) {
                            const flavorsTitle = document.createElement('h4'); // Um subtítulo para os sabores
                            flavorsTitle.textContent = `Sabores de ${specialProduct.name}:`;
                            flavorsTitle.style.marginTop = '10px';
                            flavorsTitle.style.marginLeft = '15px'; // Pequena indentação para o título dos sabores
                            categoryDiv.appendChild(flavorsTitle);

                            specialProduct.flavors.forEach(flavor => {
                                const flavorControlDiv = document.createElement('div');
                                flavorControlDiv.className = 'item-control-admin';
                                flavorControlDiv.style.marginLeft = '30px'; // Indentação maior para os sabores

                                const flavorCheckbox = document.createElement('input');
                                flavorCheckbox.type = 'checkbox';
                                flavorCheckbox.id = `flavor-avail-${specialProduct.id}-${flavor.id}`; // ID único para o sabor
                                flavorCheckbox.checked = flavor.available;
                                flavorCheckbox.dataset.category = categoryKey; // Categoria do produto pai
                                flavorCheckbox.dataset.itemId = specialProduct.id; // ID do produto pai
                                flavorCheckbox.dataset.flavorId = flavor.id; // ID do sabor específico

                                const flavorLabel = document.createElement('label');
                                flavorLabel.textContent = flavor.name;
                                flavorLabel.htmlFor = `flavor-avail-${specialProduct.id}-${flavor.id}`;

                                flavorControlDiv.appendChild(flavorCheckbox);
                                flavorControlDiv.appendChild(flavorLabel);
                                categoryDiv.appendChild(flavorControlDiv);
                            });
                        }
                    });
                } else {
                    // Lógica para categorias normais (frutas, cremes, etc.)
                    categoryItemsArray.forEach(item => {
                        const itemControlDiv = document.createElement('div');
                        itemControlDiv.className = 'item-control-admin';

                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = `item-avail-${item.id}`;
                        checkbox.checked = item.available;
                        checkbox.dataset.category = categoryKey;
                        checkbox.dataset.itemId = item.id;

                        const label = document.createElement('label');
                        label.textContent = item.name;
                        label.htmlFor = `item-avail-${item.id}`;

                        itemControlDiv.appendChild(checkbox);
                        itemControlDiv.appendChild(label);
                        categoryDiv.appendChild(itemControlDiv);
                    });
                }
                // Adiciona a div da categoria ao container principal, apenas se tiver filhos além do título
                if (categoryDiv.children.length > 1) {
                    itemsContainer.appendChild(categoryDiv);
                }
            }
        }
    }


    if (saveAvailabilityButton) {
        saveAvailabilityButton.addEventListener('click', async () => {
            if (availabilityStatusMessage) {
                availabilityStatusMessage.textContent = 'Salvando alterações de disponibilidade...';
                availabilityStatusMessage.style.color = 'orange';
            }

            const checkboxes = itemsContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(chk => {
                const category = chk.dataset.category;
                const itemId = chk.dataset.itemId;
                const flavorId = chk.dataset.flavorId; // Para identificar sabores

                if (!currentItemsData[category]) return;

                const itemInCollection = currentItemsData[category].find(i => i.id === itemId);
                if (!itemInCollection) return;

                if (flavorId) { // Se é um checkbox de sabor
                    if (itemInCollection.flavors && Array.isArray(itemInCollection.flavors)) {
                        const flavorInCollection = itemInCollection.flavors.find(f => f.id === flavorId);
                        if (flavorInCollection) {
                            flavorInCollection.available = chk.checked;
                        }
                    }
                } else { // Se é um checkbox de item principal (ou produto especial principal)
                    itemInCollection.available = chk.checked;
                }
            });

            try {
                const response = await fetch('/api/items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentItemsData, null, 2),
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                if (availabilityStatusMessage) {
                    availabilityStatusMessage.textContent = result.message;
                    availabilityStatusMessage.style.color = 'green';
                }
                 // Recarrega os itens para garantir que a UI reflita o estado salvo,
                 // especialmente porque a estrutura de currentItemsData foi modificada.
                 // Se não recarregar, modificações subsequentes podem partir de um estado obsoleto em currentItemsData.
                 fetchItemsAvailability();
            } catch (error) {
                console.error('Erro ao salvar alterações de disponibilidade:', error);
                if (availabilityStatusMessage) {
                    availabilityStatusMessage.textContent = 'Erro ao salvar alterações de disponibilidade.';
                    availabilityStatusMessage.style.color = 'red';
                }
            }
        });
    }

    // --- SELETORES PARA GERENCIAMENTO DE PEDIDOS (ATUALIZADOS) ---
    const ordersReportContainer = document.getElementById('ordersReportContainer');
    const grandTotalAllTimeEl = document.getElementById('grandTotalAllTime');
    const refreshOrdersButton = document.getElementById('refreshOrdersButton');
    const viewByDayButton = document.getElementById('viewByDayButton');
    const viewByMonthButton = document.getElementById('viewByMonthButton');

    let allOrdersCache = [];
    let currentViewMode = 'day';

    // --- FUNÇÕES AUXILIARES DE DATA ---
    function getLocalDateKey(isoTimestamp) {
        const date = new Date(isoTimestamp);
        // Ajuste para fuso horário local se necessário, mas para consistência no agrupamento, UTC pode ser melhor.
        // Para exibição, converteremos para o formato local.
        return date.toISOString().split('T')[0]; // YYYY-MM-DD em UTC
    }

    function getMonthKey(isoTimestamp) {
        const date = new Date(isoTimestamp);
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Mês em UTC
        return `${year}-${month}`; // YYYY-MM em UTC
    }

    function formatDisplayDate(dateKey) { // dateKey é YYYY-MM-DD (UTC)
        const date = new Date(dateKey + 'T00:00:00Z'); // Interpreta como UTC
        return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    }

    function formatDisplayMonth(monthKey) { // monthKey é YYYY-MM (UTC)
        const [year, month] = monthKey.split('-');
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1)); // Mês é 0-indexado
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    }


    // --- LÓGICA PRINCIPAL DE PEDIDOS ---
    async function fetchAndProcessOrders(forceFetch = false) {
        if (!ordersReportContainer || !grandTotalAllTimeEl) return;

        ordersReportContainer.innerHTML = '<p>Carregando pedidos...</p>';
        grandTotalAllTimeEl.textContent = 'Calculando...';

        if (forceFetch || allOrdersCache.length === 0) {
            try {
                const response = await fetch('/api/orders');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allOrdersCache = await response.json();
                if (!Array.isArray(allOrdersCache)) {
                    console.warn("/api/orders não retornou um array. Usando array vazio.");
                    allOrdersCache = [];
                }
                // Ordena por mais recente primeiro logo após buscar
                allOrdersCache.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            } catch (error) {
                console.error('Erro ao buscar pedidos:', error);
                ordersReportContainer.innerHTML = '<p>Erro ao carregar pedidos. Tente atualizar.</p>';
                grandTotalAllTimeEl.textContent = 'Erro';
                allOrdersCache = [];
                return;
            }
        }
        displayOrdersByGroup(allOrdersCache, currentViewMode);
    }

    function displayOrdersByGroup(ordersToDisplay, mode) {
        if (!ordersReportContainer || !grandTotalAllTimeEl) return;

        if (!Array.isArray(ordersToDisplay) || ordersToDisplay.length === 0) {
            ordersReportContainer.innerHTML = '<p>Nenhum pedido registrado ainda.</p>';
            grandTotalAllTimeEl.textContent = '0,00';
            return;
        }

        const groupedOrders = {};
        let getKeyFunction;

        if (mode === 'day')    getKeyFunction = getLocalDateKey;
        else if (mode === 'month') getKeyFunction = getMonthKey;
        else getKeyFunction = getLocalDateKey; // Padrão para dia

        ordersToDisplay.forEach(order => {
            if (order.timestamp) { // Garante que o pedido tem um timestamp
                const groupKey = getKeyFunction(order.timestamp);
                if (!groupedOrders[groupKey]) {
                    groupedOrders[groupKey] = [];
                }
                groupedOrders[groupKey].push(order);
            } else {
                console.warn("Pedido sem timestamp encontrado:", order);
                // Lidar com pedidos sem timestamp (ex: agrupar em "Data Desconhecida")
                if (!groupedOrders["unknown_date"]) groupedOrders["unknown_date"] = [];
                groupedOrders["unknown_date"].push(order);
            }
        });

        ordersReportContainer.innerHTML = '';
        let overallGrandTotal = 0;
        allOrdersCache.forEach(order => { // Calcula o total geral de TODOS os pedidos no cache
            // Adiciona verificação para valorTotal, caso seja string ou undefined
            const orderTotal = parseFloat(order.valorTotal);
            if (!isNaN(orderTotal)) {
                overallGrandTotal += orderTotal;
            }
        });
        grandTotalAllTimeEl.textContent = overallGrandTotal.toFixed(2).replace('.', ',');

        // Ordena as chaves do grupo para que os mais recentes apareçam primeiro
        const sortedGroupKeys = Object.keys(groupedOrders).sort((a, b) => {
            if (a === "unknown_date") return 1; // Joga unknown_date para o final
            if (b === "unknown_date") return -1;
            if (mode === 'month') {
                 const [yearA, monthA] = a.split('-');
                 const [yearB, monthB] = b.split('-');
                 return new Date(Date.UTC(parseInt(yearB), parseInt(monthB) - 1)) - new Date(Date.UTC(parseInt(yearA), parseInt(monthA) - 1));
            }
            return new Date(b) - new Date(a); // Para 'day', compara as datas diretamente
        });


        if (sortedGroupKeys.length === 0) {
             ordersReportContainer.innerHTML = '<p>Nenhum pedido para exibir com os filtros atuais.</p>';
        }

        sortedGroupKeys.forEach(groupKey => {
            const ordersInGroup = groupedOrders[groupKey];
            let groupTotalValue = 0;

            const groupContainerDiv = document.createElement('div');
            groupContainerDiv.className = 'group-container';

            const groupHeaderDiv = document.createElement('div');
            groupHeaderDiv.className = 'group-header';

            const groupTitle = document.createElement('h3');
            if (groupKey === "unknown_date") {
                groupTitle.textContent = "Data Desconhecida";
            } else if (mode === 'day') {
                groupTitle.textContent = formatDisplayDate(groupKey);
            } else if (mode === 'month') {
                groupTitle.textContent = formatDisplayMonth(groupKey);
            }

            const groupTotalSpan = document.createElement('span');
            groupTotalSpan.className = 'group-total';

            groupHeaderDiv.appendChild(groupTitle);
            groupHeaderDiv.appendChild(groupTotalSpan);
            groupContainerDiv.appendChild(groupHeaderDiv);

            // Ordenar pedidos dentro do grupo por timestamp (mais recente primeiro)
            // Isso já é feito no allOrdersCache, então a ordem deve ser mantida se não for reordenado aqui.
            // Se os pedidos não estiverem sendo puxados na ordem correta do groupedOrders, descomente:
            // ordersInGroup.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));


            ordersInGroup.forEach(order => {
                const orderTotalValue = parseFloat(order.valorTotal || 0);
                if (!isNaN(orderTotalValue)) {
                    groupTotalValue += orderTotalValue;
                }

                const orderDiv = document.createElement('div');
                orderDiv.className = 'order-item-admin';

                let itemsHtml = '<ul>';
                if (order.pedidoCompleto && Array.isArray(order.pedidoCompleto)) {
                    order.pedidoCompleto.forEach(subPedido => {
                        itemsHtml += `<li>`;
                        const subPedidoTotal = parseFloat(subPedido.totalPedido || 0);

                        if (subPedido.itemType === 'produto_especial') {
                            itemsHtml += `<strong>Item:</strong> ${subPedido.name || 'Produto Especial'}<br>`;
                            if (subPedido.selectedFlavor) { // Nome do campo conforme enviado pelo frontend
                                itemsHtml += `&nbsp;&nbsp;Sabor: ${subPedido.selectedFlavor}<br>`;
                            }
                        } else { // Açaí ou outros itens normais
                            itemsHtml += `<strong>Item:</strong> ${subPedido.tamanho || subPedido.produto || 'Açaí'}<br>`; // Usa 'produto' se 'tamanho' não existir
                            if (subPedido.frutas && subPedido.frutas.toLowerCase() !== "nenhuma") itemsHtml += `&nbsp;&nbsp;Frutas: ${subPedido.frutas}<br>`;
                            if (subPedido.cremes && subPedido.cremes.toLowerCase() !== "nenhum") itemsHtml += `&nbsp;&nbsp;Cremes: ${subPedido.cremes}<br>`;
                            if (subPedido.acompanhamentos && subPedido.acompanhamentos.toLowerCase() !== "nenhum") itemsHtml += `&nbsp;&nbsp;Acompanhamentos: ${subPedido.acompanhamentos}<br>`;
                            if (subPedido.coberturas && subPedido.coberturas.toLowerCase() !== "nenhuma") itemsHtml += `&nbsp;&nbsp;Coberturas: ${subPedido.coberturas}<br>`;
                        }
                        // Adicionais são comuns a ambos os tipos
                        if (subPedido.adicionais && subPedido.adicionais.toLowerCase() !== "nenhum adicional" && subPedido.adicionais.toLowerCase() !== "nenhum") {
                             itemsHtml += `&nbsp;&nbsp;Adicionais: ${subPedido.adicionais}<br>`;
                        }

                        itemsHtml += `&nbsp;&nbsp;<strong>Subtotal do Item: R$ ${subPedidoTotal.toFixed(2).replace('.', ',')}</strong>`;
                        itemsHtml += `</li>`;
                    });
                } else {
                    itemsHtml += '<li>Detalhes do item não disponíveis no formato esperado.</li>';
                }
                itemsHtml += '</ul>';

                const orderTime = order.timestamp ? new Date(order.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "Hora desconhecida";

                orderDiv.innerHTML = `
                    <h4>Pedido às ${orderTime}</h4>
                    <p><strong>Valor Total do Pedido: R$ ${orderTotalValue.toFixed(2).replace('.', ',')}</strong></p>
                    <p><strong>Pagamento:</strong> ${order.metodoPagamento || 'N/A'}</p>
                    <p><strong>Entrega/Retirada:</strong> ${order.tipoEntrega || 'N/A'}</p>
                    <div><strong>Detalhes dos Itens:</strong> ${itemsHtml}</div>
                    `; // O resumoParaAdmin pode ser muito longo aqui, melhor não exibir.
                groupContainerDiv.appendChild(orderDiv);
            });

            groupTotalSpan.textContent = `Total: R$ ${groupTotalValue.toFixed(2).replace('.', ',')}`;
            ordersReportContainer.appendChild(groupContainerDiv);
        });
    }


    function updateActiveButton(activeButton) {
        [viewByDayButton, viewByMonthButton].forEach(button => {
            if (button) button.classList.remove('active');
        });
        if (activeButton) activeButton.classList.add('active');
    }

    if (viewByDayButton) {
        viewByDayButton.addEventListener('click', () => {
            currentViewMode = 'day';
            updateActiveButton(viewByDayButton);
            displayOrdersByGroup(allOrdersCache, currentViewMode);
        });
    }
    if (viewByMonthButton) {
        viewByMonthButton.addEventListener('click', () => {
            currentViewMode = 'month';
            updateActiveButton(viewByMonthButton);
            displayOrdersByGroup(allOrdersCache, currentViewMode);
        });
    }

    if (refreshOrdersButton) {
        refreshOrdersButton.addEventListener('click', () => fetchAndProcessOrders(true));
    }

    // --- CHAMADAS INICIAIS ---
    if (document.getElementById('availabilityControl')) {
        fetchItemsAvailability();
    }
    if (document.getElementById('orderManagement')) {
        fetchAndProcessOrders(true); // Força o fetch na primeira carga da página de pedidos
        if(viewByDayButton) updateActiveButton(viewByDayButton);
    }
});
