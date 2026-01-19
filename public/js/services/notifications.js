// js/services/notifications.js
import { getStore } from '../core/store.js';

// Helper interno
const showDesktopNotification = (activity) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // Tenta usar ícone do sistema ou um genérico
    const icon = 'https://cdn-icons-png.flaticon.com/512/942/942801.png';
    
    new Notification(`🔔 Atividade Próxima: ${activity.nome}`, {
        body: `Começa às ${activity.horario_inicio}. Prepare-se!`,
        icon: icon,
        requireInteraction: true // Mantém na tela até o usuário clicar
    });
};

// Lógica de Verificação
const checkUpcomingActivities = () => {
    const { blocos_atividades } = getStore();
    if (!blocos_atividades || !Array.isArray(blocos_atividades)) return;

    const now = new Date();
    const fiveMinutesInMs = 5 * 60 * 1000;
    const checkWindowInMs = 35 * 1000; // Janela um pouco maior que o intervalo para não perder

    blocos_atividades.forEach(activity => {
        // Validação básica
        if (!activity?.horario_inicio || typeof activity.horario_inicio !== 'string') return;
        
        // Ignora se já notificado ou concluído
        if (activity.notificationSent || activity.status === 'concluido' || activity.status === 'cancelado') return;

        try {
            const [hours, minutes] = activity.horario_inicio.split(':').map(Number);
            const activityStartTime = new Date();
            activityStartTime.setHours(hours, minutes, 0, 0);

            // Ignora passado
            if (activityStartTime < now) return;

            const timeDifference = activityStartTime.getTime() - now.getTime();

            // Se faltar entre 0 e 5 minutos
            if (timeDifference > 0 && timeDifference <= fiveMinutesInMs) {
                // Evita notificar a cada 30s se já estiver na janela
                // Aqui usamos uma flag local na memória do objeto (não precisa salvar no banco)
                console.log(`🔔 Notificando: ${activity.nome}`);
                showDesktopNotification(activity);
                activity.notificationSent = true; 
            }
        } catch (error) {
            console.warn("Erro ao processar notificação:", error);
        }
    });
};

// --- FUNÇÃO PRINCIPAL (EXPORTADA) ---
export const startNotificationService = () => {
    // 1. Pede permissão ao iniciar
    if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notificações ativadas!');
                }
            });
        }
    }

    // 2. Roda verificação inicial
    checkUpcomingActivities();

    // 3. Inicia o Loop (30 segundos)
    setInterval(checkUpcomingActivities, 30000);
    
    console.log('⏰ Serviço de Notificações Iniciado.');
};