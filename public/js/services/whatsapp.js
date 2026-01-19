// js/services/whatsapp.js

export const openWhatsAppChat = (rawPhone, text = '') => {
    // ... (limpeza e validação do telefone igual antes) ...
    let phone = rawPhone.replace(/\D/g, '');
    if (phone.length <= 11) phone = '55' + phone;
    const encodedText = encodeURIComponent(text);

    // Detecção
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        // Celular: Sempre usa API universal
        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`, '_blank');
    } else {
        // Desktop: Tenta forçar o APP usando o protocolo direto
        // Isso tenta abrir o App Desktop ou o que estiver configurado no Windows
        window.location.href = `whatsapp://send?phone=${phone}&text=${encodedText}`;
        
        // NOTA: Se o usuário não tiver o App, nada acontece ou dá erro.
        // Por segurança, muitos preferem manter o https://web.whatsapp.com
    }
};