import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, Observer, of } from 'rxjs';

export const mimeType = (
  control: AbstractControl
): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
  if (typeof control.value === 'string') {
    return of(null);
  }
  const file = control.value as File;

  if (!file || typeof file !== 'object') {
    return Promise.resolve(null);
  }

  return new Observable((observer: Observer<ValidationErrors | null>) => {
    const fileReader = new FileReader();

    fileReader.addEventListener('loadend', () => {
      const arr = new Uint8Array(fileReader.result as ArrayBuffer).subarray(
        0,
        4
      );
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }

      const validHeaders = [
        '89504e47', // PNG
        'ffd8ffe0', // JPEG variants
        'ffd8ffe1',
        'ffd8ffe2',
        'ffd8ffe3',
        'ffd8ffe8',
      ];

      if (validHeaders.includes(header)) {
        observer.next(null); // valid, no error
      } else {
        observer.next({ invalidMimeType: true }); // invalid file type error
      }

      observer.complete();
    });

    fileReader.readAsArrayBuffer(file);
  });
};
