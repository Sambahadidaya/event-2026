export function generateRandomString(length, chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function generateRandomNumber(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10).toString();
    }
    return result;
}

export function generateKodeFormWajib(site) {
    // 2 huruf site aktif (Pk atau Ps) + 2 angka random + 2 huruf random
    const prefix = site === 'pkkmb' ? 'Pk' : 'Ps';
    return `${prefix}${generateRandomNumber(2)}${generateRandomString(2)}`;
}

export function generateKodeFormRegister(jenisKode, namaKode) {
    // Ps + 2 huruf jenis_lomba + 2 huruf nama_lomba + 2 angka random + 2 huruf random
    return `Ps${jenisKode || 'XX'}${namaKode || 'XX'}${generateRandomNumber(2)}${generateRandomString(2)}`;
}

export function generateKodePeserta(baseKodeForm) {
    // kode_form + 2 angka random + 2 huruf random
    return `${baseKodeForm || 'X'}${generateRandomNumber(2)}${generateRandomString(2)}`;
}

export function generateNim(kategori, nama, emailWa) {
    const firstWord = (nama || '').trim().split(' ')[0] || '';
    let suffix = '';
    if (emailWa) {
        if (emailWa.includes('@')) {
            const beforeAt = emailWa.split('@')[0];
            suffix = beforeAt.slice(-4);
        } else {
            suffix = emailWa.slice(-4);
        }
    }
    return `${kategori}${firstWord}${suffix}`.replace(/[^a-zA-Z0-9]/g, '');
}
