import axios from 'axios';

const valorValido = valor => valor && valor !== 'Indefinida' && valor !== 'N/A';

export const obterServiceLineSLL = async userLocal => {
    const atual = userLocal?.SL_REGISTO || userLocal?.SERVICE_LINE;
    if (valorValido(atual)) return atual;

    const response = await axios.get(
        `https://softinsa-api-riya.onrender.com/users/configuracoes/${userLocal.ID_UTILIZADOR}`
    );
    const serviceLine = response.data?.data?.serviceLine;
    if (!valorValido(serviceLine)) {
        throw new Error('Service Line do SLL não identificada');
    }

    const userAtualizado = {
        ...userLocal,
        SL_REGISTO: serviceLine,
        SERVICE_LINE: serviceLine
    };
    sessionStorage.setItem('user', JSON.stringify(userAtualizado));
    return serviceLine;
};
