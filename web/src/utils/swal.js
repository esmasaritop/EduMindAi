import Swal from 'sweetalert2';

const baseConfig = {
  showCancelButton: true,
  confirmButtonText: 'Evet, sil',
  cancelButtonText: 'İptal',
  confirmButtonColor: '#ef4444',
  cancelButtonColor: '#64748b',
  reverseButtons: true,
  focusCancel: true,
  buttonsStyling: true,
  customClass: {
    popup: 'edumind-swal-popup',
    title: 'edumind-swal-title',
    htmlContainer: 'edumind-swal-text',
    confirmButton: 'edumind-swal-confirm',
    cancelButton: 'edumind-swal-cancel',
  },
};

export async function confirmDelete({ title = 'Emin misiniz?', text = 'Bu işlem geri alınamaz.' } = {}) {
  const result = await Swal.fire({
    ...baseConfig,
    title,
    text,
    icon: 'warning',
  });

  return result.isConfirmed;
}

export function showSuccess(message, title = 'Başarılı') {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'Tamam',
  });
}

export function showError(message, title = 'Hata') {
  return Swal.fire({
    title,
    text: message,
    icon: 'error',
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'Tamam',
  });
}
