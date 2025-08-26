# مهاجرت به سرویس‌های مستقل Xray

## تغییرات اعمال شده

در این به‌روزرسانی، سیستم مدیریت Xray از پروسه‌های فرعی به سرویس‌های مستقل systemd تغییر یافته است.

### مزایای سیستم جدید:

1. **استقلال سرویس‌ها**: هر تانل دارای سرویس مستقل Xray است که مستقل از اپلیکیشن اصلی اجرا می‌شود
2. **مدیریت بهتر**: استفاده از systemd برای مدیریت خودکار restart و monitoring
3. **پایداری بیشتر**: در صورت خرابی اپلیکیشن اصلی، سرویس‌های Xray همچنان فعال باقی می‌مانند
4. **امنیت بهتر**: هر سرویس با تنظیمات امنیتی مجزا اجرا می‌شود
5. **لاگ‌گیری بهتر**: لاگ‌های هر تانل در فایل‌های جداگانه ذخیره می‌شوند

## فایل‌های تغییر یافته:

### فایل‌های جدید:
- `src/utils/xrayService.ts` - مدیریت سرویس‌های systemd برای Xray

### فایل‌های به‌روزرسانی شده:
- `src/app/api/tunnels/[id]/start/route.ts` - استفاده از سرویس‌های مستقل
- `src/app/api/tunnels/[id]/stop/route.ts` - توقف سرویس‌های مستقل
- `src/app/api/tunnels/[id]/restart/route.ts` - راه‌اندازی مجدد سرویس‌ها
- `src/app/api/tunnels/route.ts` - پاک‌سازی سرویس‌ها هنگام حذف تانل

## ساختار سرویس‌های جدید:

### مسیرهای فایل‌ها:
- **فایل‌های پیکربندی**: `/etc/raptor-tunnel/xray-{tunnel-id}.json`
- **فایل‌های سرویس**: `/etc/systemd/system/xray-tunnel-{tunnel-id}.service`
- **فایل‌های لاگ**: `/var/log/raptor-tunnel/xray-{tunnel-id}.log`

### نام‌گذاری سرویس‌ها:
- نام سرویس: `xray-tunnel-{tunnel-id}`
- مثال: `xray-tunnel-abc123`

## دستورات مدیریت سرویس:

```bash
# مشاهده وضعیت سرویس
sudo systemctl status xray-tunnel-{tunnel-id}

# شروع سرویس
sudo systemctl start xray-tunnel-{tunnel-id}

# توقف سرویس
sudo systemctl stop xray-tunnel-{tunnel-id}

# راه‌اندازی مجدد سرویس
sudo systemctl restart xray-tunnel-{tunnel-id}

# مشاهده لاگ‌ها
sudo journalctl -u xray-tunnel-{tunnel-id} -f

# یا مشاهده فایل لاگ مستقیم
sudo tail -f /var/log/raptor-tunnel/xray-{tunnel-id}.log
```

## ویژگی‌های امنیتی:

- **NoNewPrivileges**: جلوگیری از افزایش دسترسی‌ها
- **ProtectSystem**: محافظت از فایل‌های سیستم
- **ProtectHome**: محافظت از دایرکتوری home کاربران
- **ReadWritePaths**: دسترسی محدود به مسیرهای لاگ

## مهاجرت از سیستم قدیم:

1. تانل‌های فعلی به طور خودکار با سیستم جدید کار خواهند کرد
2. هنگام restart یا start مجدد تانل‌ها، سرویس‌های جدید ایجاد می‌شوند
3. سرویس‌های قدیمی به طور خودکار متوقف و پاک می‌شوند

## نکات مهم:

1. **دسترسی sudo**: سیستم جدید نیاز به دسترسی sudo دارد
2. **systemd**: فقط روی سیستم‌های Linux با systemd کار می‌کند
3. **فایروال**: مطمئن شوید پورت‌های SOCKS5 در فایروال باز هستند
4. **مانیتورینگ**: می‌توانید از `systemctl` برای مانیتورینگ سرویس‌ها استفاده کنید

## عیب‌یابی:

### اگر سرویس شروع نمی‌شود:
```bash
# بررسی وضعیت سرویس
sudo systemctl status xray-tunnel-{tunnel-id}

# مشاهده لاگ‌های خطا
sudo journalctl -u xray-tunnel-{tunnel-id} --no-pager

# بررسی فایل پیکربندی
sudo cat /etc/raptor-tunnel/xray-{tunnel-id}.json
```

### اگر پورت در حال استفاده است:
```bash
# پیدا کردن پروسه‌ای که از پورت استفاده می‌کند
sudo netstat -tulpn | grep :{port}

# یا
sudo ss -tulpn | grep :{port}
```

### پاک‌سازی دستی سرویس‌ها:
```bash
# لیست تمام سرویس‌های xray
sudo systemctl list-units --type=service | grep xray-tunnel

# حذف سرویس خاص
sudo systemctl stop xray-tunnel-{tunnel-id}
sudo systemctl disable xray-tunnel-{tunnel-id}
sudo rm /etc/systemd/system/xray-tunnel-{tunnel-id}.service
sudo rm /etc/raptor-tunnel/xray-{tunnel-id}.json
sudo rm /var/log/raptor-tunnel/xray-{tunnel-id}.log
sudo systemctl daemon-reload
```