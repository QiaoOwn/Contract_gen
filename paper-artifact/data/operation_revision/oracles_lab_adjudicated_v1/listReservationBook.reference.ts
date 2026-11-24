import {ListBookHistory as Original} from '../../../test/LibraryManagementSystem-listBookHistory-listReservationBook/entry';

export * from '../../../test/LibraryManagementSystem-listBookHistory-listReservationBook/entry';

export class ListBookHistory extends Original {
  override listReservationBook(uid: string) {
    return [...new Set(super.listReservationBook(uid))];
  }
}
