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
                const category = currentItemsData[categoryKey];
                if (!Array.isArray(category)) continue;

                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'category-admin';
                const categoryTitle = document.createElement('h3');
                // Excluir 'produtos_especiais' ou ajustar exibição se necessário na seção de disponibilidade
                // Para o controle de disponibilidade, talvez você só queira mostrar o "Copo da Felicidade" como disponível/indisponível, não seus sabores individuais.
                // Se você quiser controlar a disponibilidade por sabor, a estrutura do items.json e esta função renderItemsAvailability precisarão ser ajustadas.
                // Por enquanto, vamos pular a exibição da categoria "produtos_especiais" no controle de disponibilidade se não for relevante.
                // Se a categoria produtos_especiais contém itens que VOCÊ quer controlar a disponibilidade (como o próprio Copo da Felicidade), descomente e ajuste.
                 if (categoryKey === 'produtos_especiais') {
                     // Você pode decidir como quer exibir produtos especiais no controle de disponibilidade
                     // Por exemplo, apenas o item principal "Copo da Felicidade"
                     const specialProduct = category.find(item => item.id === 'copo_felicidade');
                     if (specialProduct) {
                         const specialProductDiv = document.createElement('div');
                         specialProductDiv.className = 'item-control-admin';

                         const checkbox = document.createElement('input');
                         checkbox.type = 'checkbox';
                         checkbox.id = `item-avail-${specialProduct.id}`;
                         checkbox.checked = specialProduct.available;
                         checkbox.dataset.category = categoryKey;
                         checkbox.dataset.itemId = specialProduct.id;

                         const label = document.createElement('label');
                         label.textContent = specialProduct.name;
                         label.htmlFor = `item-avail-${specialProduct.id}`;

                         specialProductDiv.appendChild(checkbox);
                         specialProductDiv.appendChild(label);
                         categoryDiv.appendChild(specialProductDiv);
                     }
                 } else {
                     // Lógica existente para outras categorias
                     categoryTitle.textContent = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
                     categoryDiv.appendChild(categoryTitle);

                     category.forEach(item => {
                         const itemDiv = document.createElement('div');
                         itemDiv.className = 'item-control-admin';

                         const checkbox = document.createElement('input');
                         checkbox.type = 'checkbox';
                         checkbox.id = `item-avail-${item.id}`;
                         checkbox.checked = item.available;
                         checkbox.dataset.category = categoryKey;
                         checkbox.dataset.itemId = item.id;

                         const label = document.createElement('label');
                         label.textContent = item.name;
                         label.htmlFor = `item-avail-${item.id}`;

                         itemDiv.appendChild(checkbox);
                         itemDiv.appendChild(label);
                         categoryDiv.appendChild(itemDiv);
                     });
                 }

                 // Adiciona a categoriaDiv apenas se houver conteúdo para ela (itens ou o produto especial)
                 if (categoryDiv.children.length > (categoryKey === 'produtos_especiais' ? 0 : 1)) { // Se não for produtos_especiais, verifica se tem mais de 1 filho (o título + itens)
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
                // Encontrar o item na estrutura atual baseada na categoria e id
                const itemInCollection = currentItemsData[category]?.find(i => i.id === itemId);
                if (itemInCollection) {
                    itemInCollection.available = chk.checked;
                }
                 // Nota: Se você decidir controlar a disponibilidade por sabor, esta lógica precisará ser mais complexa
                 // para encontrar e atualizar o sub-item de sabor dentro do produto especial.
            });

            try {
                const response = await fetch('/api/items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentItemsData, null, 2), // Adicionado null, 2 para formatar o JSON
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const result = await response.json();
                if (availabilityStatusMessage) {
                    availabilityStatusMessage.textContent = result.message;
                    availabilityStatusMessage.style.color = 'green';
                }
                 // Atualizar o cache após salvar com sucesso
                 fetchItemsAvailability(); // Ou simplesmente atualizar currentItemsData com o resultado da resposta
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
    const ordersReportContainer = document.getElementById('ordersReportContainer'); // Mudou de ordersListContainer
    const grandTotalAllTimeEl = document.getElementById('grandTotalAllTime');   // Mudou de grandTotalValueEl
    const refreshOrdersButton = document.getElementById('refreshOrdersButton');
    const viewByDayButton = document.getElementById('viewByDayButton');
    const viewByMonthButton = document.getElementById('viewByMonthButton');
    // const viewByWeekButton = document.getElementById('viewByWeekButton'); // Para o futuro

    let allOrdersCache = [];
    let currentViewMode = 'day';

    // --- FUNÇÕES AUXILIARES DE DATA ---
    function getLocalDateKey(isoTimestamp) {
        const date = new Date(isoTimestamp);
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    }

    function getMonthKey(isoTimestamp) {
        const date = new Date(isoTimestamp);
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        const year = localDate.getFullYear();
        const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    }

    function formatDisplayDate(dateKey) {
        const date = new Date(dateKey + 'T00:00:00');
         // Ajuste para garantir que a data seja interpretada no fuso horário local antes de formatar
         const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        return localDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    function formatDisplayMonth(monthKey) {
        const [year, month] = monthKey.split('-');
        // Mês é 0-indexado no construtor Date
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
                if (!Array.isArray(allOrdersCache)) { // Garante que é um array
                    console.warn("/api/orders não retornou um array. Usando array vazio.");
                    allOrdersCache = [];
                }
                allOrdersCache.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            } catch (error) {
                console.error('Erro ao buscar pedidos:', error);
                ordersReportContainer.innerHTML = '<p>Erro ao carregar pedidos. Tente atualizar.</p>';
                grandTotalAllTimeEl.textContent = 'Erro';
                allOrdersCache = []; // Limpa o cache em caso de erro para tentar buscar novamente
                return;
            }
        }

        displayOrdersByGroup(allOrdersCache, currentViewMode);
    }

    function displayOrdersByGroup(ordersToDisplay, mode) {
        if (!ordersReportContainer || !grandTotalAllTimeEl) return;

        if (!Array.isArray(ordersToDisplay) || ordersToDisplay.length === 0) {
            ordersReportContainer.innerHTML = '<p>Nenhum pedido registrado ainda (ou para o filtro atual).</p>';
            grandTotalAllTimeEl.textContent = '0,00';
            return;
        }

        const groupedOrders = {};
        let getKeyFunction;

        if (mode === 'day')    getKeyFunction = getLocalDateKey;
        else if (mode === 'month') getKeyFunction = getMonthKey;
        else getKeyFunction = getLocalDateKey;

        ordersToDisplay.forEach(order => {
             // Garante que order.timestamp existe antes de agrupar
            if (order.timestamp) {
                const groupKey = getKeyFunction(order.timestamp);
                if (!groupedOrders[groupKey]) {
                    groupedOrders[groupKey] = [];
                }
                groupedOrders[groupKey].push(order);
            } else {
                console.warn("Pedido sem timestamp encontrado:", order);
                // Opcional: Adicionar a um grupo "Sem Data" ou ignorar
            }
        });


        ordersReportContainer.innerHTML = '';
        let overallGrandTotal = 0;
        // Calcula o total geral de TODOS os pedidos no cache
        allOrdersCache.forEach(order => overallGrandTotal += parseFloat(order.valorTotal || 0));
        grandTotalAllTimeEl.textContent = overallGrandTotal.toFixed(2).replace('.', ',');

        const sortedGroupKeys = Object.keys(groupedOrders).sort((a, b) => {
            if (mode === 'month') {
                 // Cria objetos Date para comparação de meses
                 const [yearA, monthA] = a.split('-');
                 const [yearB, monthB] = b.split('-');
                 return new Date(parseInt(yearB), parseInt(monthB) - 1) - new Date(parseInt(yearA), parseInt(monthA) - 1);
            }
            // Comparação de datas para visualização por dia
            return new Date(b) - new Date(a);
        });


        if (sortedGroupKeys.length === 0 && ordersToDisplay.length > 0) {
             ordersReportContainer.innerHTML = '<p>Nenhum pedido encontrado para este período/filtro.</p>';
        } else if (sortedGroupKeys.length === 0 && ordersToDisplay.length === 0) {
             ordersReportContainer.innerHTML = '<p>Nenhum pedido registrado ainda.</p>';
        }


        sortedGroupKeys.forEach(groupKey => {
            const ordersInGroup = groupedOrders[groupKey];
            let groupTotalValue = 0;

            const groupContainerDiv = document.createElement('div');
            groupContainerDiv.className = 'group-container';

            const groupHeaderDiv = document.createElement('div');
            groupHeaderDiv.className = 'group-header';

            const groupTitle = document.createElement('h3');
            if (mode === 'day') groupTitle.textContent = formatDisplayDate(groupKey);
            else if (mode === 'month') groupTitle.textContent = formatDisplayMonth(groupKey);
            else groupTitle.textContent = groupKey; // Fallback


            const groupTotalSpan = document.createElement('span');
            groupTotalSpan.className = 'group-total';

            groupHeaderDiv.appendChild(groupTitle);
            groupHeaderDiv.appendChild(groupTotalSpan);
            groupContainerDiv.appendChild(groupHeaderDiv);

            ordersInGroup.forEach(order => {
                const orderTotalValue = parseFloat(order.valorTotal || 0);
                groupTotalValue += orderTotalValue;

                const orderDiv = document.createElement('div');
                orderDiv.className = 'order-item-admin';

                let itemsHtml = '<ul>';
                if (order.pedidoCompleto && Array.isArray(order.pedidoCompleto)) {
                    order.pedidoCompleto.forEach(subPedido => {
                        itemsHtml += `<li>`;

                        // --- LÓGICA MODIFICADA AQUI ---
                        // Verifica se o item é um "produto_especial" (como o Copo da Felicidade)
                        // Assume que o frontend envia um campo 'itemType'
                        if (subPedido.itemType === 'produto_especial') {
                            itemsHtml += `<strong>Item:</strong> ${subPedido.name || 'Produto Especial'}<br>`;
                            if (subPedido.selectedFlavor) {
                                itemsHtml += `&nbsp;&nbsp;Sabor: ${subPedido.selectedFlavor}<br>`;
                            }
                            // Não exibe frutas, cremes, etc. para produtos especiais
                        } else {
                            // Lógica existente para itens de açaí/outros
                            itemsHtml += `<strong>Item:</strong> ${subPedido.tamanho || 'Açaí'}<br>`;
                            if (subPedido.frutas && subPedido.frutas.toLowerCase() !== "nenhuma") itemsHtml += `&nbsp;&nbsp;Frutas: ${subPedido.frutas}<br>`;
                            if (subPedido.cremes && subPedido.cremes.toLowerCase() !== "nenhum") itemsHtml += `&nbsp;&nbsp;Cremes: ${subPedido.cremes}<br>`;
                            if (subPedido.acompanhamentos && subPedido.acompanhamentos.toLowerCase() !== "nenhum") itemsHtml += `&nbsp;&nbsp;Acompanhamentos: ${subPedido.acompanhamentos}<br>`;
                            if (subPedido.coberturas && subPedido.coberturas.toLowerCase() !== "nenhuma") itemsHtml += `&nbsp;&nbsp;Coberturas: ${subPedido.coberturas}<br>`;
                            if (subPedido.adicionais && subPedido.adicionais.toLowerCase() !== "nenhum adicional") itemsHtml += `&nbsp;&nbsp;Adicionais: ${subPedido.adicionais}<br>`;
                        }
                        // --- FIM DA LÓGICA MODIFICADA ---

                        itemsHtml += `&nbsp;&nbsp;<strong>Subtotal do Item: R$ ${parseFloat(subPedido.totalPedido || 0).toFixed(2).replace('.', ',')}</strong>`;
                        itemsHtml += `</li>`;
                    });
                }
                itemsHtml += '</ul>';

                // Formatar o timestamp do pedido para exibição
                const orderTime = new Date(order.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                orderDiv.innerHTML = `
                    <h4>Pedido às ${orderTime}</h4>
                    <p><strong>Valor Total do Pedido: R$ ${orderTotalValue.toFixed(2).replace('.', ',')}</strong></p>
                    <p><strong>Pagamento:</strong> ${order.metodoPagamento || 'N/A'}</p>
                    <p><strong>Entrega/Retirada:</strong> ${order.tipoEntrega || 'N/A'}</p>
                    <div><strong>Detalhes dos Itens:</strong> ${itemsHtml}</div>
                    `;
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
        fetchAndProcessOrders(true);
        if(viewByDayButton) updateActiveButton(viewByDayButton); // Define o botão 'Dia' como ativo inicialmente
    }
});