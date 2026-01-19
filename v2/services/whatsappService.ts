/**
 * WhatsApp Service
 * Ported from v1/js/services/whatsapp.js
 */

export const openWhatsAppChat = (rawPhone: string, text: string = '') => {
    // Basic cleaning
    let phone = rawPhone.replace(/\D/g, '');

    if (phone.length === 0) {
        alert("Número de telefone inválido.");
        return;
    }

    if (phone.length <= 11) phone = '55' + phone; // Assume BR if no country code
    const encodedText = encodeURIComponent(text);

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`, '_blank');
    } else {
        // Desktop: Try app protocol, default/fallback browser handling
        window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`, '_blank');
    }
};
