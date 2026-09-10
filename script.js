
const logBox = document.getElementById('debug-log');
const fileInput = document.getElementById('qr-input');
let codeReader = null;
let selectedDeviceId = null;
let base64Avatar = "";

const keywords = {
    m1: { en: "Computer Essentials", vi: "(Cơ bản về máy tính)" },
    m2: { en: "Online Essentials", vi: "(Sử dụng mạng trực tuyến)" },
    m3: { en: "Word Processing", vi: "(Xử lý văn bản)" },
    m4: { en: "Spreadsheets", vi: "(Bảng tính cơ bản)" },
    m5: { en: "Presentation", vi: "(Trình chiếu cơ bản)" },
    m6: { en: "Data Analytic", vi: "(Phân tích dữ liệu)" },
    m7: { en: "Using Database", vi: "(Sử dụng cơ sở dữ liệu)" },
    m8: { en: "Artificial Intelligence", vi: "(Trí tuệ nhân tạo)" },
    m9: { en: "Advanced Word Processing", vi: "(Xử lý văn bản nâng cao)" },
    m10: { en: "Management Spreadsheets", vi: "(Bảng tính nâng cao)" },
    m11: { en: "Presentation Advanced", vi: "(Trình chiếu nâng cao)" },
    m12: { en: "IT Security", vi: "(Bảo mật CNTT)" }
};

function addLog(msg) {
    console.log(msg);
    logBox.innerHTML = `> ${msg}`;
    logBox.scrollTop = logBox.scrollHeight;
}

window.addEventListener('load', function () {
    codeReader = new ZXing.BrowserQRCodeReader();

    const moduleContainer = document.getElementById('module-container');
    for (let key in keywords) {
        const div = document.createElement('label');
        div.className = 'module-item';
        div.style.display = "flex";
        div.style.alignItems = "flex-start";
        div.style.gap = "8px";

        div.innerHTML = `
        <input type="checkbox" name="modules" value="${key}" onchange="tinhTien()" style="margin-top: 2px;">
        <div>
            <div style="font-weight: bold; color: #000; font-size: 12px;">${keywords[key].en}</div>
            <div style="font-size: 11px; color: #666;">${keywords[key].vi}</div>
        </div>
    `;
        moduleContainer.appendChild(div);
    }

    fileInput.addEventListener('change', e => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const imageUrl = URL.createObjectURL(files[0]);
        addLog("Đang đọc mã QR từ file ảnh CCCD...");

        codeReader.decodeFromImageUrl(imageUrl)
            .then(result => {
                addLog("Quét mã QR CCCD thành công!");
                dienDuLieuVaoForm(result.text);
            })
            .catch(err => {
                addLog("Không tìm thấy mã QR hợp lệ trong ảnh.");
            });
    });
});

function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            base64Avatar = e.target.result;
            const preview = document.getElementById('avatar-preview');
            preview.src = base64Avatar;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

function tinhTien() {
    let selected = {};
    for (let key in keywords) {
        const checkbox = document.querySelector(`input[name="modules"][value="${key}"]`);
        selected[key] = (checkbox && checkbox.checked) ? "X" : "";
    }

    let giaTienSo = 0;
    let count = 0;
    for (let key in selected) {
        if (selected[key] === "X") count++;
    }

    const coCombo5 = (selected.m1 === "X" && selected.m2 === "X" && selected.m3 === "X" && selected.m4 === "X" && selected.m5 === "X");
    if (coCombo5) {
        giaTienSo += 2200000;
    } else {
        ['m1', 'm2', 'm3', 'm4', 'm5'].forEach(key => {
            if (selected[key] === "X") giaTienSo += 640000;
        });
    }

    if (selected.m8 === "X") giaTienSo += 1500000;
    if (selected.m6 === "X") giaTienSo += 800000;
    if (selected.m7 === "X") giaTienSo += 800000;
    if (selected.m12 === "X") giaTienSo += 800000;

    const danhSachDaTinh = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm12'];
    for (let key in selected) {
        if (!danhSachDaTinh.includes(key) && selected[key] === "X") {
            giaTienSo += 640000;
        }
    }

    document.getElementById('count-module').innerText = count;
    document.getElementById('total-price').innerText = giaTienSo.toLocaleString('vi-VN') + "đ";
}

async function startCamera() {
    // Hiện khung popup chứa camera hình vuông lên
    const popup = document.getElementById('camera-popup');
    if (popup) popup.style.display = 'flex';

    const videoElem = document.getElementById('video-preview');
    if (videoElem) videoElem.style.display = 'block';

    try {
        const devices = await codeReader.listVideoInputDevices();
        let selectedDeviceId = devices[0]?.deviceId;
        if (devices.length > 0) {
            selectedDeviceId = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('sau'))?.deviceId || devices[0].deviceId;
        }

        addLog("Đang mở camera trực tiếp...");
        codeReader.decodeFromVideoDevice(selectedDeviceId, 'video-preview', (result, err) => {
            if (result) {
                addLog("Quét thành công qua camera!");
                dienDuLieuVaoForm(result.text);
                stopCamera(); // Tự động đóng camera ngay lập tức khi quét được!
            }
        });
    } catch (err) {
        addLog("Lỗi mở camera: " + err.message);
        stopCamera();
    }
}

function stopCamera() {
    if (codeReader) codeReader.reset();

    // Ẩn khung popup đi
    const popup = document.getElementById('camera-popup');
    if (popup) popup.style.display = 'none';
}

function dienDuLieuVaoForm(decodedText) {
    const parts = decodedText.split('|');
    if (parts.length >= 7) {
        document.getElementById('cccd').value = parts[0] || '';
        const fullName = (parts[2] || '').trim();
        const nameParts = fullName.split(' ');
        if (nameParts.length > 1) {
            const firstName = nameParts.pop();
            const lastName = nameParts.join(' ');
            document.getElementById('lastname').value = lastName;
            document.getElementById('firstname').value = firstName;
        } else {
            document.getElementById('lastname').value = fullName;
            document.getElementById('firstname').value = '';
        }

        let rawDob = parts[3] || '';
        if (rawDob.length === 8) {
            rawDob = `${rawDob.slice(0, 2)}/${rawDob.slice(2, 4)}/${rawDob.slice(4, 8)}`;
        }
        document.getElementById('dob').value = rawDob;
        document.getElementById('gender').value = parts[4] || '';
        document.getElementById('address').value = parts[5] || '';
        addLog("Đã nạp dữ liệu định danh CCCD vào form!");
    } else {
        addLog("Mã QR không đúng định dạng thông tin CCCD.");
    }
}

function handleGeneratePDF(e) {
    e.preventDefault();
    const cccd = document.getElementById('cccd').value;
    if (!cccd) {
        alert("Vui lòng quét mã QR trên CCCD trước khi xác nhận!");
        return;
    }

    let soModule = parseInt(document.getElementById('count-module').innerText);
    if (soModule === 0) {
        alert("Vui lòng chọn ít nhất một module đăng ký thi!");
        return;
    }

    const ho_dem = document.getElementById('lastname').value;
    const ten = document.getElementById('firstname').value;
    const sdt = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const job = document.getElementById('job').value;
    const dob = document.getElementById('dob').value;
    const gender = document.getElementById('gender').value;
    const address = document.getElementById('address').value;
    const totalPriceText = document.getElementById('total-price').innerText;

    let pob = "";
    if (address.includes(",")) {
        const addParts = address.split(",");
        pob = addParts[addParts.length - 1].trim();
    } else {
        pob = address;
    }

    let col1Html = "";
    let col2Html = "";
    let emailModulesList = [];
    let index = 0;

    for (let key in keywords) {
        const checkbox = document.querySelector(`input[name="modules"][value="${key}"]`);
        if (checkbox && checkbox.checked) {
            const mod = keywords[key]; // Lấy object gồm {en, vi}

            const itemHtml = `
            <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-weight: bold; color: #000; font-size: 12px;">${mod.en}</div>
                    <div style="font-size: 10px; color: #555;">${mod.vi}</div>
                </div>
                <span style="font-weight: bold;">☑</span>
            </div>
        `;

            if (index % 2 === 0) {
                col1Html += itemHtml;
            } else {
                col2Html += itemHtml;
            }
            emailModulesList.push(`- ${mod.en} ${mod.vi}`);
            index++;
        }
    }

    document.getElementById('pdf-lastname').innerText = ho_dem;
    document.getElementById('pdf-firstname').innerText = ten;
    document.getElementById('pdf-cccd').innerText = cccd;
    document.getElementById('pdf-dob').innerText = dob;
    document.getElementById('pdf-gender').innerText = gender;
    document.getElementById('pdf-pob').innerText = pob;
    document.getElementById('pdf-address').innerText = address;
    document.getElementById('pdf-phone').innerText = sdt;
    document.getElementById('pdf-email').innerText = email;
    document.getElementById('pdf-job').innerText = job;
    document.getElementById('pdf-sign-name').innerText = `${ho_dem} ${ten}`;

    document.getElementById('pdf-modules-col1').innerHTML = col1Html;
    document.getElementById('pdf-modules-col2').innerHTML = col2Html;

    if (base64Avatar) {
        document.getElementById('pdf-avatar-img').src = base64Avatar;
    }

    const now = new Date();
    document.getElementById('pdf-current-date').innerText = `TP.HCM, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

    let giaTienSo = 0;
    let selectedRaw = {};
    for (let key in keywords) {
        const cb = document.querySelector(`input[name="modules"][value="${key}"]`);
        selectedRaw[key] = (cb && cb.checked) ? "X" : "";
    }
    const coCombo5 = (selectedRaw.m1 === "X" && selectedRaw.m2 === "X" && selectedRaw.m3 === "X" && selectedRaw.m4 === "X" && selectedRaw.m5 === "X");
    if (coCombo5) {
        giaTienSo += 2200000;
    } else {
        ['m1', 'm2', 'm3', 'm4', 'm5'].forEach(k => { if (selectedRaw[k] === "X") giaTienSo += 640000; });
    }
    if (selectedRaw.m8 === "X") giaTienSo += 1500000;
    if (selectedRaw.m6 === "X") giaTienSo += 800000;
    if (selectedRaw.m7 === "X") giaTienSo += 800000;
    if (selectedRaw.m12 === "X") giaTienSo += 800000;
    ['m9', 'm10', 'm11'].forEach(k => { if (selectedRaw[k] === "X") giaTienSo += 640000; });

    const noiDungCK = `${ho_dem} ${ten} - ${sdt} - ICDL`.toUpperCase();
    const qrUrl = `https://img.vietqr.io/image/MB-1973033338-compact2.jpg?amount=${giaTienSo}&addInfo=${encodeURIComponent(noiDungCK)}`;

    const candidateRecord = {
        cccd, ho_dem, ten, sdt, email, job, dob, address, pob,
        modules: emailModulesList, total: totalPriceText, time: now.toLocaleString()
    };
    let danhSachDangKy = JSON.parse(localStorage.getItem('icdl_candidates') || '[]');
    danhSachDangKy.push(candidateRecord);
    localStorage.setItem('icdl_candidates', JSON.stringify(danhSachDangKy));

    const subject = encodeURIComponent(`[VMB EDUCATION] Xác Nhận Đăng Ký Dự Thi ICDL & Thông Tin Thanh Toán`);
    const body = encodeURIComponent(
        `Chào bạn ${ho_dem} ${ten},

Cảm ơn bạn đã đăng ký dự thi ICDL tại VMB Education. Dưới đây là thông tin đăng ký và thanh toán học phí của bạn:

DANH SÁCH MODULE ĐĂNG KÝ:
${emailModulesList.join('\n')}

- Tổng số lượng: ${soModule} Module
- Tổng học phí cần thanh toán: ${totalPriceText}

THÔNG TIN CHUYỂN KHOẢN:
- Ngân hàng: MB Bank
- Số tài khoản: 1973.033.338
- Chủ tài khoản: Công ty Cổ phần Đầu tư Phát triển Sách và Học liệu Điện tử Việt Nam
- Nội dung chuyển khoản: ${noiDungCK}

Quét mã QR thanh toán nhanh: ${qrUrl}

Vui lòng kiểm tra lại thông tin, thực hiện chuyển khoản và gửi màn hình giao dịch cho tư vấn viên để kích hoạt hồ sơ chính thức.

Trân trọng,
VMB EDUCATION.`
    );

    document.getElementById('btn-open-gmail').href = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;

    document.getElementById('input-container').style.display = 'none';
    document.getElementById('pdf-preview-box').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function quayLaiChinhSua() {
    document.getElementById('pdf-preview-box').style.display = 'none';
    document.getElementById('input-container').style.display = 'block';
}
// Hàm chuyển từ Bước 1 sang Bước 2 (có kiểm tra nhập liệu bắt buộc ở Bước 1)
function goToStep2() {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const job = document.getElementById('job').value.trim();
    const region = document.getElementById('exam-region').value;

    if (!name || !phone || !email || !job || !region) {
        alert("Vui lòng điền đầy đủ thông tin ở Bước 1 và chọn khu vực dự thi!");
        return;
    }

    // Lưu thông tin Họ tên từ bước 1 sang ô Họ tên (nếu quét CCCD có thể gộp hoặc ghi đè tùy ý)
    // Ẩn bước 1, hiện bước 2
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';

    // Hiển thị tên khu vực lên bảng giá
    document.getElementById('display-region').innerText = (region === 'hcm') ? 'TP. Hồ Chí Minh' : 'Hà Nội';
    
    // Cập nhật lại giá tiền ngay lập tức dựa theo khu vực vừa chọn
    tinhToanHocPhi();
}

function backToStep1() {
    document.getElementById('step-2').style.display = 'none';
    document.getElementById('step-1').style.display = 'block';
}

// Cấu hình bảng giá theo khu vực (Ví dụ mẫu, bạn có thể chỉnh lại số tiền cho phù hợp)
function tinhToanHocPhi() {
    // 1. Lấy khu vực dự thi từ Bước 1
    const region = document.getElementById('exam-region').value; // 'hcm' hoặc 'hanoi'

    // 2. Gom trạng thái các module được chọn
    let selectedRaw = {};
    // Giả sử keywords hoặc các giá trị value của checkbox module lần lượt tương ứng m1, m2,... m12
    // Hoặc bạn có thể duyệt qua tất cả checkbox đang checked:
    const checkboxes = document.querySelectorAll('.module-checkbox-grid input[type="checkbox"]');
    
    checkboxes.forEach(cb => {
        // Lấy tên/giá trị của module, ví dụ cb.value chứa 'm1', 'm2'... hoặc bạn đang đặt tên theo value
        const key = cb.value; 
        selectedRaw[key] = cb.checked ? "X" : "";
    });

    let giaTienSo = 0;

    // 3. Phân chia biểu giá dựa theo Khu vực
    if (region === 'hcm') {
        // --- BẢNG GIÁ TP. HỒ CHÍ MINH ---
        const coCombo5 = (selectedRaw.m1 === "X" && selectedRaw.m2 === "X" && selectedRaw.m3 === "X" && selectedRaw.m4 === "X" && selectedRaw.m5 === "X");
        if (coCombo5) {
            giaTienSo += 2200000;
        } else {
            ['m1', 'm2', 'm3', 'm4', 'm5'].forEach(k => { if (selectedRaw[k] === "X") giaTienSo += 640000; });
        }
        if (selectedRaw.m8 === "X") giaTienSo += 1500000;
        if (selectedRaw.m6 === "X") giaTienSo += 800000;
        if (selectedRaw.m7 === "X") giaTienSo += 800000;
        if (selectedRaw.m12 === "X") giaTienSo += 800000;
        ['m9', 'm10', 'm11'].forEach(k => { if (selectedRaw[k] === "X") giaTienSo += 640000; });

    } else if (region === 'hanoi') {
        // --- BẢNG GIÁ HÀ NỘI (Bạn thay đổi số tiền ở đây cho phù hợp) ---
        // Ví dụ Hà Nội có thể có mức giá khác hoặc cấu trúc combo khác:
      let countM1toM5 = 0;
        ['m1', 'm2', 'm3', 'm4', 'm5'].forEach(k => {
            if (selectedRaw[k] === "X") countM1toM5++;
        });

        // Áp dụng giá dựa trên số lượng module m1->m5
        if (countM1toM5 === 5) {
            giaTienSo += 2100000; // Combo 5 module
        } else if (countM1toM5 === 4) {
            giaTienSo += 1900000; // Combo 4 module mới thêm
        } else if (countM1toM5 === 3) {
            giaTienSo += 1650000; // Combo 3 module mới thêm
        } else {
            // Dưới 3 module hoặc lẻ thì tính đơn giá từng môn là 600k
            ['m1', 'm2', 'm3', 'm4', 'm5'].forEach(k => { 
                if (selectedRaw[k] === "X") giaTienSo += 600000; 
            });
        }

        // Các module còn lại ở Hà Nội
        if (selectedRaw.m8 === "X") giaTienSo += 1500000;
        if (selectedRaw.m6 === "X") giaTienSo += 800000;
        if (selectedRaw.m7 === "X") giaTienSo += 800000;
        if (selectedRaw.m12 === "X") giaTienSo += 800000;
        ['m9', 'm10', 'm11'].forEach(k => { if (selectedRaw[k] === "X") giaTienSo += 600000; });
    }

    // 4. Đếm tổng số module đã chọn để hiển thị ra giao diện
    const countChecked = Object.values(selectedRaw).filter(val => val === "X").length;

    // 5. Cập nhật kết quả lên giao diện HTML
    document.getElementById('count-module').innerText = countChecked;
    document.getElementById('total-price').innerText = giaTienSo.toLocaleString('vi-VN') + 'đ';
}

// Lắng nghe sự kiện khi người dùng check/uncheck các module hoặc đổi khu vực thi
document.addEventListener('change', function(e) {
    if (e.target.closest('#module-container') || e.target.id === 'exam-region') {
        tinhToanHocPhi();
    }
});
function hoanTatVaTaiVe() {
    const element = document.getElementById('pdf-preview-box');
    
    // 1. Ẩn tạm thời hộp hướng dẫn và các nút bấm đi trước khi chụp
    const noticeBox = element.querySelector('div[style*="background-color: #e2f0cb"]');
    const actionButtons = element.querySelector('.action-buttons-box');
    
    if (noticeBox) noticeBox.style.display = 'none';
    if (actionButtons) actionButtons.style.display = 'none';

    // 2. Cấu hình xuất file
    const opt = {
        margin:       [0, 0, 0, 0], 
        filename:     'Phieu_Dang_Ky_ICDL.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 1.5, // Giảm scale nhẹ (1.5) giúp điện thoại render nhanh và không bị tràn bộ nhớ
            useCORS: true,
            letterRendering: true,
            scrollY: 0
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };

    // 3. Sử dụng outputPdf để tạo file tương thích tốt nhất trên di động
    html2pdf().from(element).set(opt).outputPdf('blob').then(function(pdfBlob) {
        // Tạo đường dẫn ảo để kích hoạt tải file trên điện thoại
        const blobUrl = URL.createObjectURL(pdfBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = 'Phieu_Dang_Ky_ICDL.pdf';
        
        // Thêm vào DOM, bấm tự động rồi xóa đi
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });

    // 4. Sau 1.5 giây, hiện lại các nút bấm trên giao diện web
    setTimeout(function() {
        if (noticeBox) noticeBox.style.display = 'block';
        if (actionButtons) actionButtons.style.display = 'flex';
    }, 1500);
}


    // 2. Lấy link Gmail đã được tạo sẵn từ trước (hoặc tạo trực tiếp link mailto / URL gửi mail của bạn)
    // Giả sử bạn đang gán sẵn link vào thuộc tính href hoặc có sẵn biến chứa link mail:
    //const emailUrl = document.getElementById('btn-open-gmail').getAttribute('data-gmail-url'); 
    
    // Nếu bạn muốn mở liên kết mail sau khi tải (đợi khoảng 1 giây để trình duyệt kịp kích hoạt tải file)
   // setTimeout(() => {
        // Lấy đường link mailto hoặc link Gmail bạn đang dùng
     //   const userEmail = document.getElementById('email').value;
      //  const regName = document.getElementById('reg-name').value;
        
        // Tạo link gửi mail tự động (hoặc giữ lại link cũ của bạn)
    //    const mailtoLink = `mailto:${userEmail}?subject=Xac nhan dang ky du thi ICDL&body=Chao ${regName}, phieu dang ky cua ban da duoc tai ve.`;
        
     //   window.location.href = mailtoLink; 
  //  }, 1000);
