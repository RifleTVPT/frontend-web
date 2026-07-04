export const abrirPartilhaLinkedIn = async ({ urlPartilha, urlPublica, texto }) => {
    const emLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    if (emLocalhost) {
        window.open(
            'https://www.linkedin.com/feed/?shareActive=true',
            '_blank',
            'noopener,noreferrer'
        );
        try {
            await navigator.clipboard.writeText(`${texto}\n\n${urlPublica}`);
            alert(
                'O LinkedIn não consegue consultar páginas localhost. '
                + 'O texto e o link foram copiados: cole-os na publicação com Ctrl+V. '
                + 'Depois de publicar no Render, o badge aparecerá automaticamente como pré-visualização.'
            );
        } catch {
            alert('Copie o link público do badge e cole-o manualmente na publicação do LinkedIn.');
        }
        return;
    }

    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlPartilha)}`;
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
};
