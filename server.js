const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let messages = [];  // Mesajları burada saklayacağız
let users = {};     // Kullanıcıların anonim isimleri, renkleri ve mesaj sayıları

// Public klasörüne statik dosyaları servis et
app.use(express.static('public'));

// Ana sayfaya yönlendiren route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Kullanıcı bağlantısı
io.on('connection', (socket) => {
    // Kullanıcı için anonim bir isim ve rastgele renk oluştur
    const username = `Anonim-${Math.floor(Math.random() * 1000)}`;
    const color = '#000000'; // Varsayılan renk siyah
    users[socket.id] = { username, messageCount: 0, color };

    // Kullanıcıya önceki mesajları gönder
    socket.emit('previous messages', messages);

    console.log(`${username} bağlandı`);

    // Kullanıcı ismini değiştirme
    socket.on('change username', (newUsername) => {
        if (newUsername.trim() !== "") {
            users[socket.id].username = newUsername;
        }
    });

    // Kullanıcı isminin rengini değiştirme
    socket.on('change color', (newColor) => {
        if (newColor) {
            users[socket.id].color = newColor; // Renk güncelleniyor
        }
    });

    // Yeni mesaj geldiğinde tüm kullanıcılara ilet
    socket.on('chat message', (msg) => {
        users[socket.id].messageCount++;  // Mesaj sayısını artır
        const message = {
            username: users[socket.id].username,
            text: msg,
            count: users[socket.id].messageCount,
            color: users[socket.id].color, // Renk bilgisi ekleniyor
        };
        messages.push(message);
        io.emit('chat message', message);  // Tüm kullanıcılara mesajı gönder
    });

    // Kullanıcı ayrıldığında
    socket.on('disconnect', () => {
        console.log(`${users[socket.id].username} ayrıldı`);
        delete users[socket.id];  // Kullanıcıyı sil
    });
});

// Sunucuyu başlat
server.listen(3000, () => {
    console.log('Chat uygulaması http://localhost:3000 adresinde çalışıyor');
});
