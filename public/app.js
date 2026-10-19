/* ==========================================================================
   NORTECAFÉ PRO - SISTEMA DE INFORMACIÓN AGTECH
   Lógica Principal (Splash de Carga, Modo Online/Offline, Mercado y Cálculos)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // ESTADO GLOBAL DEL SISTEMA
    // ==========================================
    let isOnlineMode = true;
    let trmActual = 4132.20;
    let contratoCActual = 224.50;
    let precioBaseCarga = 2150000;
    let trmChartInstance = null;

    const historicoLabels = ['Vie', 'Sáb', 'Dom', 'Lun', 'Mar', 'Mié', 'Hoy'];
    const historicoDatosTRM = [4085.00, 4098.40, 4092.10, 4110.50, 4125.80, 4118.00, 4132.20];

    // Fecha actual formateada para la píldora superior ("15 OCT")
    const datePillEl = document.getElementById('current-date-pill');
    if (datePillEl) {
        const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const hoy = new Date();
        datePillEl.textContent = `${hoy.getDate()} ${meses[hoy.getMonth()]}`;
    }

    // ==========================================
    // 1. LOGIN CON PANTALLA DE CARGA ANIMADA DE CAFÉ
    // ==========================================
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loaderStatusText = document.getElementById('loader-status-text');
    const loaderProgressFill = document.getElementById('loader-progress-fill');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cedula = document.getElementById('username').value.trim();
            const pin = document.getElementById('password').value.trim();

            if (cedula !== '' && pin !== '') {
                // Mostrar pantalla de carga de café
                if (loadingOverlay) {
                    loadingOverlay.classList.add('active');
                    loaderProgressFill.style.width = '25%';
                    loaderStatusText.textContent = 'Verificando credenciales del caficultor...';

                    setTimeout(() => {
                        loaderProgressFill.style.width = '65%';
                        loaderStatusText.textContent = 'Sincronizando TRM y Contrato C de NY...';
                    }, 650);

                    setTimeout(() => {
                        loaderProgressFill.style.width = '100%';
                        loaderStatusText.textContent = 'Cargando lotes de Finca El Recuerdo...';
                    }, 1350);

                    setTimeout(() => {
                        loadingOverlay.classList.remove('active');
                        loginView.classList.remove('active');
                        dashboardView.classList.add('active');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        inicializarGraficoTRM();
                    }, 2000);
                } else {
                    loginView.classList.remove('active');
                    dashboardView.classList.add('active');
                    inicializarGraficoTRM();
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cerrarDrawerMovil();
            dashboardView.classList.remove('active');
            loginView.classList.add('active');
            if (loaderProgressFill) loaderProgressFill.style.width = '0%';
            if (loginForm) loginForm.reset();
        });
    }

    // ==========================================
    // 2. NAVEGACIÓN MÓVIL (DRAWER, TOPBAR Y BOTTOM NAV)
    // ==========================================
    const navBtns = document.querySelectorAll('.nav-btn');
    const navBtnsTop = document.querySelectorAll('.nav-btn-top');
    const sections = document.querySelectorAll('.content-section');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btnOpenSidebar = document.getElementById('btn-open-sidebar');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');

    function abrirDrawerMovil() {
        if (sidebar && overlay) {
            sidebar.classList.add('open');
            overlay.classList.add('active');
        }
    }

    function cerrarDrawerMovil() {
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    }

    if (btnOpenSidebar) btnOpenSidebar.addEventListener('click', abrirDrawerMovil);
    if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', cerrarDrawerMovil);
    if (overlay) overlay.addEventListener('click', cerrarDrawerMovil);

    function cambiarSeccion(targetId) {
        if (!targetId) return;

        sections.forEach(sec => {
            sec.classList.toggle('active', sec.id === targetId);
        });

        navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-target') === targetId);
        });

        cerrarDrawerMovil();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (targetId === 'inicio') {
            setTimeout(() => {
                if (trmChartInstance) {
                    trmChartInstance.resize();
                } else {
                    inicializarGraficoTRM();
                }
            }, 60);
        }
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarSeccion(btn.getAttribute('data-target'));
        });
    });

    navBtnsTop.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarSeccion(btn.getAttribute('data-target'));
        });
    });

    // ==========================================
    // 3. MODO EN LÍNEA / SIN CONEXIÓN (BOCETO AJUSTES)
    // ==========================================
    const btnStatusPill = document.getElementById('btn-status-pill');
    const statusPillText = document.getElementById('status-pill-text');
    const toggleOnlineSwitch = document.getElementById('toggle-online-switch');
    const connTitleText = document.getElementById('conn-title-text');
    const connDescText = document.getElementById('conn-desc-text');
    const connWifiIconBox = document.getElementById('conn-wifi-icon-box');
    const offlineBanner = document.getElementById('offline-banner');
    const syncLabels = document.querySelectorAll('.sync-time-label');

    function actualizarEstadoConexion(online) {
        isOnlineMode = online;

        if (toggleOnlineSwitch) toggleOnlineSwitch.checked = online;

        if (online) {
            if (btnStatusPill) {
                btnStatusPill.classList.remove('offline');
                btnStatusPill.classList.add('online');
            }
            if (statusPillText) statusPillText.textContent = 'En línea';
            if (connTitleText) connTitleText.textContent = 'Conexión activa';
            if (connDescText) connDescText.textContent = 'Los datos nuevos se sincronizarán.';
            if (connWifiIconBox) connWifiIconBox.classList.remove('offline-mode');
            if (offlineBanner) offlineBanner.style.display = 'none';

            const ahora = new Date();
            const horaStr = ahora.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
            syncLabels.forEach(el => {
                el.textContent = `Última sincronización: hoy, ${horaStr}`;
            });
        } else {
            if (btnStatusPill) {
                btnStatusPill.classList.remove('online');
                btnStatusPill.classList.add('offline');
            }
            if (statusPillText) statusPillText.textContent = 'Sin señal';
            if (connTitleText) connTitleText.textContent = 'Modo sin conexión';
            if (connDescText) connDescText.textContent = 'Guardando cambios en el teléfono.';
            if (connWifiIconBox) connWifiIconBox.classList.add('offline-mode');
            if (offlineBanner) offlineBanner.style.display = 'flex';

            syncLabels.forEach(el => {
                el.textContent = 'Datos guardados en memoria local';
            });
        }
    }

    // Al tocar la píldora "En línea" de arriba, lleva a la vista Conexión y datos
    if (btnStatusPill) {
        btnStatusPill.addEventListener('click', () => {
            cambiarSeccion('conexion');
        });
    }

    if (toggleOnlineSwitch) {
        toggleOnlineSwitch.addEventListener('change', (e) => {
            actualizarEstadoConexion(e.target.checked);
        });
    }

    // Detectar también si el navegador pierde o recupera internet real
    window.addEventListener('online', () => actualizarEstadoConexion(true));
    window.addEventListener('offline', () => actualizarEstadoConexion(false));

    // ==========================================
    // 4. GRÁFICO HISTÓRICO TRM Y ACTUALIZACIÓN EN VIVO
    // ==========================================
    function inicializarGraficoTRM() {
        const canvas = document.getElementById('trmChart');
        if (!canvas) return;

        if (trmChartInstance) {
            trmChartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 190);
        gradient.addColorStop(0, 'rgba(30, 107, 67, 0.28)');
        gradient.addColorStop(1, 'rgba(30, 107, 67, 0.02)');

        const minVal = Math.min(...historicoDatosTRM);
        const maxVal = Math.max(...historicoDatosTRM);

        trmChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: historicoLabels,
                datasets: [{
                    label: 'TRM ($ COP)',
                    data: historicoDatosTRM,
                    borderColor: '#1E6B43',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#F0A52B',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#23120B',
                        titleColor: '#F0A52B',
                        bodyColor: '#FFFFFF',
                        padding: 10,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (context) => 'TRM: $' + context.parsed.y.toLocaleString('es-CO', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }) + ' COP'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#717572', font: { size: 11, weight: '600' } }
                    },
                    y: {
                        suggestedMin: Math.floor(minVal - 15),
                        suggestedMax: Math.ceil(maxVal + 15),
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            color: '#717572',
                            font: { size: 11 },
                            maxTicksLimit: 5,
                            callback: (value) => '$' + Math.round(value).toLocaleString('es-CO')
                        }
                    }
                }
            }
        });
    }

    const trmSpan = document.getElementById('trm-value');
    const nySpan = document.getElementById('ny-value');

    setInterval(() => {
        // Solo actualiza precios en vivo si está "En línea"
        if (!isOnlineMode) return;

        const deltaTrm = (Math.random() - 0.48) * 2.8;
        const deltaNy = (Math.random() - 0.48) * 0.65;

        trmActual = Math.max(4080, Math.min(4190, trmActual + deltaTrm));
        contratoCActual = Math.max(215, Math.min(248, contratoCActual + deltaNy));

        if (trmSpan) {
            trmSpan.textContent = '$' + trmActual.toLocaleString('es-CO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        if (nySpan) {
            nySpan.textContent = contratoCActual.toLocaleString('es-CO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        if (trmChartInstance) {
            historicoDatosTRM[historicoDatosTRM.length - 1] = Number(trmActual.toFixed(2));
            trmChartInstance.update('none');
        }
    }, 5000);

    // ==========================================
    // 5. CALCULADORA DE TRILLA Y CALIDAD
    // ==========================================
    const btnCalcularTrilla = document.getElementById('btn-calcular');
    const inputMuestra = document.getElementById('peso-muestra');
    const inputExcelso = document.getElementById('peso-excelso');
    const inputBroca = document.getElementById('peso-broca');
    const inputPasilla = document.getElementById('peso-pasilla');
    const resFr = document.getElementById('res-fr');
    const resDescuento = document.getElementById('res-descuento');
    const resPrecio = document.getElementById('res-precio');

    if (btnCalcularTrilla) {
        btnCalcularTrilla.addEventListener('click', () => {
            const muestra = parseFloat(inputMuestra.value) || 250;
            const excelso = parseFloat(inputExcelso.value) || 0;
            const broca = parseFloat(inputBroca.value) || 0;
            const pasilla = parseFloat(inputPasilla.value) || 0;

            if (excelso <= 0 || excelso > muestra) {
                alert('Por favor ingresa un peso de Almendra Sana Excelso válido (Ej. entre 150g y 220g).');
                inputExcelso.focus();
                return;
            }

            const frCalculado = (muestra * 70) / excelso;
            const porcentajeBroca = (broca / muestra) * 100;
            const porcentajePasilla = (pasilla / muestra) * 100;

            const diferenciaFR = 94 - frCalculado;
            const ajustePorFR = diferenciaFR * 18500;

            let penalizacionDefectos = 0;
            if (porcentajeBroca > 2) penalizacionDefectos += (porcentajeBroca - 2) * 22000;
            if (porcentajePasilla > 5) penalizacionDefectos += (porcentajePasilla - 5) * 12000;
            if (ajustePorFR < 0) penalizacionDefectos += Math.abs(ajustePorFR);

            const bonificacionCalidad = ajustePorFR > 0 ? ajustePorFR : 0;
            const precioFinalCarga = Math.max(0, Math.round(precioBaseCarga + bonificacionCalidad - penalizacionDefectos));

            resFr.textContent = frCalculado.toFixed(2);
            resDescuento.textContent = '-$' + Math.round(penalizacionDefectos).toLocaleString('es-CO') + ' COP';
            resPrecio.textContent = '$' + precioFinalCarga.toLocaleString('es-CO') + ' COP';
        });
    }

    // ==========================================
    // 6. CALCULADORA DE FLETES LOGÍSTICOS
    // ==========================================
    const btnFlete = document.getElementById('btn-flete');
    const selectOrigen = document.getElementById('mun-origen');
    const selectDestino = document.getElementById('mun-destino');
    const inputCargas = document.getElementById('cant-cargas');
    const resFlete = document.getElementById('res-flete');

    if (btnFlete) {
        btnFlete.addEventListener('click', () => {
            const tarifaBasePorCarga = parseFloat(selectOrigen.value) || 15000;
            const destino = selectDestino.value;
            const cantidadCargas = parseInt(inputCargas.value, 10) || 1;

            const multiplicadorDestino = destino === 'Pamplona' ? 1.15 : 1.0;
            const descuentoVolumen = cantidadCargas >= 10 ? 0.90 : 1.0;
            const costoTotalFlete = Math.round(tarifaBasePorCarga * cantidadCargas * multiplicadorDestino * descuentoVolumen);

            resFlete.textContent = '$' + costoTotalFlete.toLocaleString('es-CO') + ' COP';
        });
    }

    // ==========================================
    // 7. GESTIÓN DE FINCA Y CRUD DE LOTES
    // ==========================================
    const formLote = document.getElementById('form-lote');
    const inputLoteId = document.getElementById('lote-id');
    const inputLoteNombre = document.getElementById('lote-nombre');
    const inputLoteArea = document.getElementById('lote-area');
    const inputLoteAltitud = document.getElementById('lote-altitud');
    const selectLoteVariedad = document.getElementById('lote-variedad');
    const formLoteTitle = document.getElementById('form-lote-title');
    const btnGuardarLote = document.getElementById('btn-guardar-lote');
    const tablaLotesBody = document.querySelector('#tabla-lotes tbody');
    const totalAreaValue = document.getElementById('total-area-value');

    function recalcularHectareasTotales() {
        if (!tablaLotesBody || !totalAreaValue) return;
        let suma = 0;
        tablaLotesBody.querySelectorAll('.td-area').forEach(td => {
            const val = parseFloat(td.textContent);
            if (!isNaN(val)) suma += val;
        });
        totalAreaValue.textContent = suma.toFixed(1);
    }

    function vincularBotonesEditarLote() {
        if (!tablaLotesBody) return;
        tablaLotesBody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = () => {
                const fila = btn.closest('tr');
                if (!fila) return;
                inputLoteId.value = fila.getAttribute('data-id');
                inputLoteNombre.value = fila.querySelector('.td-nombre').textContent;
                selectLoteVariedad.value = fila.querySelector('.td-variedad').textContent;
                inputLoteArea.value = fila.querySelector('.td-area').textContent;
                const altEl = fila.querySelector('.td-altitud');
                inputLoteAltitud.value = altEl ? altEl.textContent : '1650';

                if (formLoteTitle) formLoteTitle.textContent = 'Editando: ' + inputLoteNombre.value;
                if (btnGuardarLote) btnGuardarLote.innerHTML = '<i class="fa-solid fa-check"></i> Actualizar Lote';
                inputLoteNombre.focus();
            };
        });
    }

    vincularBotonesEditarLote();
    recalcularHectareasTotales();

    if (formLote) {
        formLote.addEventListener('submit', (e) => {
            e.preventDefault();
            const idActual = inputLoteId.value.trim();
            const nombre = inputLoteNombre.value.trim();
            const area = parseFloat(inputLoteArea.value) || 0;
            const altitud = inputLoteAltitud.value.trim() || '1650';
            const variedad = selectLoteVariedad.value;

            if (!nombre || area <= 0) return;

            if (idActual !== '') {
                const filaExistente = tablaLotesBody.querySelector(`tr[data-id="${idActual}"]`);
                if (filaExistente) {
                    filaExistente.querySelector('.td-nombre').textContent = nombre;
                    filaExistente.querySelector('.td-variedad').textContent = variedad;
                    filaExistente.querySelector('.td-area').textContent = area.toFixed(1);
                    const altEl = filaExistente.querySelector('.td-altitud');
                    if (altEl) altEl.textContent = altitud;
                }
            } else {
                const nuevaFila = document.createElement('tr');
                nuevaFila.setAttribute('data-id', Date.now().toString());
                nuevaFila.innerHTML = `
                    <td class="td-nombre">${nombre}</td>
                    <td class="td-variedad">${variedad}</td>
                    <td class="td-area">${area.toFixed(1)}</td>
                    <td class="td-altitud" style="display:none;">${altitud}</td>
                    <td><button type="button" class="btn-sm btn-edit" title="Editar Lote"><i class="fa-solid fa-pen"></i></button></td>
                `;
                tablaLotesBody.appendChild(nuevaFila);
            }

            formLote.reset();
            inputLoteId.value = '';
            if (formLoteTitle) formLoteTitle.textContent = 'Registrar Nuevo Lote';
            if (btnGuardarLote) btnGuardarLote.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Lote';
            vincularBotonesEditarLote();
            recalcularHectareasTotales();
        });
    }

    // ==========================================
    // 8. PERFIL Y NOTIFICACIONES
    // ==========================================
    const formPerfil = document.getElementById('form-perfil');
    const inputFarmName = document.getElementById('input-farm-name');
    const inputUserName = document.getElementById('input-user-name');
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarFarmName = document.getElementById('sidebar-farm-name');
    const greetingUserName = document.getElementById('greeting-user-name');

    if (formPerfil) {
        formPerfil.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevoNombreFinca = inputFarmName.value.trim();
            const nuevoNombreUsuario = inputUserName.value.trim();

            if (nuevoNombreUsuario) {
                if (sidebarUserName) sidebarUserName.textContent = nuevoNombreUsuario;
                if (greetingUserName) greetingUserName.textContent = nuevoNombreUsuario;
            }
            if (nuevoNombreFinca && sidebarFarmName) {
                sidebarFarmName.textContent = nuevoNombreFinca;
            }
            alert('¡Datos actualizados correctamente!');
        });
    }

    const badgeNavCount = document.getElementById('badge-nav-count');
    const badgeTopCount = document.getElementById('badge-top-count');

    document.querySelectorAll('.btn-mark-read').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.notification-card');
            if (card && card.classList.contains('unread')) {
                card.classList.remove('unread');
                btn.style.display = 'none';
                const noLeidas = document.querySelectorAll('.notification-card.unread').length;
                if (badgeNavCount) {
                    badgeNavCount.textContent = noLeidas;
                    badgeNavCount.style.display = noLeidas > 0 ? 'inline-block' : 'none';
                }
                if (badgeTopCount) {
                    badgeTopCount.textContent = noLeidas;
                    badgeTopCount.style.display = noLeidas > 0 ? 'flex' : 'none';
                }
            }
        });
    });

});