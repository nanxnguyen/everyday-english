function pronunciationTip(w){
 const tips=[];const p=w.ipa;
 const special={receipt:'Chữ p không đọc; nhấn âm /siːt/.',hour:'Chữ h không đọc; bắt đầu bằng /aʊ/.',honest:'Chữ h không đọc; nhấn âm đầu.',clothes:'Một âm tiết; giữ cụm cuối /ðz/, không thêm âm “ờ”.',vegetable:'Thường ba âm tiết: /vedʒ/ – /tə/ – /bəl/.',comfortable:'Nhấn âm đầu; phần giữa đọc nhẹ.',read:'Mục này là /riːd/ ở hiện tại. Dạng quá khứ cùng chữ viết đọc /red/.',update:'Trong ví dụ là danh từ: nhấn UP. Động từ thường nhấn DATE.',download:'Động từ thường nhấn LOAD; danh từ thường nhấn DOWN.',upload:'Động từ thường nhấn LOAD; danh từ thường nhấn UP.',refund:'Danh từ nhấn RE; động từ thường nhấn FUND.',schedule:'Giọng Mỹ: bắt đầu /sk/. Giọng Anh có thể bắt đầu /ʃ/.',aunt:'Giọng Mỹ còn có biến thể /ɑnt/.','listen to':'Trong listen, chữ t không đọc.'};
 if(special[w.word])tips.push(special[w.word]);
 if(p.includes('θ'))tips.push('/θ/: đầu lưỡi nhẹ giữa hai hàm răng, thổi hơi không rung cổ.');
 else if(p.includes('ð'))tips.push('/ð/: đầu lưỡi nhẹ giữa hai hàm răng, thổi hơi có rung cổ.');
 if(p.includes('æ'))tips.push('/æ/: mở miệng rộng, lưỡi thấp và hướng trước.');
 else if(p.includes('ɝ'))tips.push('/ɝ/: giữ màu r kiểu Mỹ; đầu lưỡi không chạm vòm.');
 else if(p.includes('ʃ'))tips.push('/ʃ/: hơi đi liên tục; không bật thành âm ch.');
 else if(p.includes('ŋ'))tips.push('/ŋ/: gần âm “ng”; không tự thêm /ɡ/ ở cuối.');
 if(!tips.length&&p.includes('ə'))tips.push('/ə/: đọc nhẹ, ngắn, gần “ơ”; không nhấn mạnh.');
 if(!tips.length&&p.includes('iː'))tips.push('/iː/: lưỡi cao phía trước, môi hơi kéo ngang; nghe và giữ âm rõ.');
 if(!tips.length&&p.includes('ɪ'))tips.push('/ɪ/: nguyên âm ngắn, thả lỏng hơn /iː/.');
 if(!tips.length)tips.push('Nghe một lượt, nhắc lại chậm; giữ âm cuối, không thêm “ờ”.');
 if(w.word.includes(' '))tips.push('Đọc liền cụm; nhấn từ mang ý chính.');
 else if(p.includes('ˈ'))tips.push('Dấu /ˈ/ đứng ngay trước âm tiết nhấn chính.');
 return tips.slice(0,2).join(' ');
}
