import {ListBookHistory as Original} from '../../../test/LibraryManagementSystem-listBookHistory-listOverDueBook/entry';

export * from '../../../test/LibraryManagementSystem-listBookHistory-listOverDueBook/entry';

export class ListBookHistory extends Original {
  override listOverDueBook(uid: string) {
    return [...new Set(super.listOverDueBook(uid))];
  }
}
