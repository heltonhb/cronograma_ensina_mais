export const showToast = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    // Adicionamos a classe base e a classe de entrada
    toast.className = `toast toast--${type} toast-enter`;
    
    const icons = {
        success: '<span style="font-size:1.2em">✅</span>',
        error: '<span style="font-size:1.2em">❌</span>',
        warning: '<span style="font-size:1.2em">⚠️</span>',
        info: '<span style="font-size:1.2em">ℹ️</span>'
    };

    toast.innerHTML = `${icons[type] || ''} <span>${message}</span>`;
    container.appendChild(toast);

    // Tempo de exibição (5 segundos)
    setTimeout(() => {
        // Truque: Removemos a animação de entrada para limpar o estado
        toast.classList.remove('toast-enter');
        
        // Forçamos um "reflow" (ler uma propriedade) para o navegador processar a mudança
        void toast.offsetWidth; 
        
        // Adicionamos a saída
        toast.classList.add('toast-exit');
        
        // Quando a animação de saída acabar, remove do HTML
        toast.addEventListener('animationend', () => {
            toast.remove();
            if (container.children.length === 0) container.remove();
        });
    }, 3000);
};