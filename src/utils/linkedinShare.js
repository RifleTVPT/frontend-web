export const abrirPartilhaLinkedIn = async ({ urlPartilha, urlPublica, texto }) => {
    const emLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    try {
        const textoParaCopiar = `${texto}\n\nDescubra mais aqui: ${urlPublica}\n#Softinsa #Badges #Certificação`;
        await navigator.clipboard.writeText(textoParaCopiar);
        alert(
            'O texto da publicação foi copiado para a sua área de transferência!\n\n' +
            'No ecrã do LinkedIn, pressione Ctrl+V (ou colar) na caixa de texto para partilhar os detalhes do seu badge.'
        );
    } catch {
        alert('Partilha iniciada! Devido às permissões do seu browser, não foi possível copiar o texto automaticamente. Pode escrevê-lo na publicação.');
    }

    if (emLocalhost) {
        window.open(
            'https://www.linkedin.com/feed/?shareActive=true',
            '_blank',
            'noopener,noreferrer'
        );
        return;
    }

    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlPartilha)}`;
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
};
