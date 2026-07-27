fokus ke file report.js pada folder lib/pdf. 
difile itu tepatnya dibaris dipaling atas saya ingin membuat array baru untuk menentukan nama Ketua Pelaksana dari setiap site, contohnya seperti ini 

const roleMappings = {
    'ketua_pelaksana_pkkmb': 'Nindya Dwi Lestari',
    'ketua_pelaksana_pose': 'Nadia Nita',
};
jadi jika sitenya pkkmb maka mapping ke Nindya, jika sitenya pose maka mapping ke Nadia. jadi bukan pakai ( .................................... )