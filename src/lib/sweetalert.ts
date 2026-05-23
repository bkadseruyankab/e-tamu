import Swal from 'sweetalert2';

// Default configuration for SweetAlert
const defaultConfig = {
  confirmButtonColor: '#059669', // emerald-600
  cancelButtonColor: '#6b7280', // gray-500
  customClass: {
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn',
    popup: 'swal-popup',
    title: 'swal-title',
    content: 'swal-content',
  },
};

// Success Alert
export const showSuccess = (title: string, message?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'success',
    title,
    text: message,
    timer: message ? undefined : 2000,
    showConfirmButton: !!message,
  });
};

// Error Alert
export const showError = (title: string, message?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'error',
    title,
    text: message,
  });
};

// Warning Alert
export const showWarning = (title: string, message?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title,
    text: message,
  });
};

// Info Alert
export const showInfo = (title: string, message?: string) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'info',
    title,
    text: message,
  });
};

// Confirm Dialog
export const showConfirm = async (
  title: string,
  message?: string,
  confirmText: string = 'Ya',
  cancelText: string = 'Batal'
): Promise<boolean> => {
  const result = await Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
  return result.isConfirmed;
};

// Delete Confirmation
export const showDeleteConfirm = async (
  itemName: string = 'item ini'
): Promise<boolean> => {
  return showConfirm(
    'Hapus Data?',
    `Apakah Anda yakin ingin menghapus ${itemName}? Tindakan ini tidak dapat dibatalkan.`,
    'Ya, Hapus',
    'Batal'
  );
};

// Loading Alert
export const showLoading = (title: string = 'Memproses...') => {
  return Swal.fire({
    ...defaultConfig,
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close Loading
export const closeLoading = () => {
  Swal.close();
};

// Toast Notification (small popup in corner)
export const showToast = (
  icon: 'success' | 'error' | 'warning' | 'info' | 'question',
  title: string
) => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: 'swal-toast',
    },
  });
};

// Success Toast
export const showSuccessToast = (message: string) => {
  return showToast('success', message);
};

// Error Toast
export const showErrorToast = (message: string) => {
  return showToast('error', message);
};

// Input Dialog
export const showInputDialog = async (
  title: string,
  placeholder?: string,
  inputValue?: string
): Promise<string | null> => {
  const result = await Swal.fire({
    ...defaultConfig,
    title,
    input: 'text',
    inputPlaceholder: placeholder,
    inputValue: inputValue || '',
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    inputValidator: (value) => {
      if (!value.trim()) {
        return 'Field ini tidak boleh kosong!';
      }
      return null;
    },
  });
  return result.isConfirmed ? result.value : null;
};

// Textarea Dialog
export const showTextareaDialog = async (
  title: string,
  placeholder?: string,
  inputValue?: string
): Promise<string | null> => {
  const result = await Swal.fire({
    ...defaultConfig,
    title,
    input: 'textarea',
    inputPlaceholder: placeholder,
    inputValue: inputValue || '',
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    inputAttributes: {
      rows: '4',
    },
  });
  return result.isConfirmed ? result.value : null;
};

// Export default Swal for custom use
export default Swal;
