export const getEmojiUrl = (id: string | null | undefined): string => {
  if (!id) {
    return '';
  }

  return `asset://emojis/${id}`;
};

export const getIconUrl = (id: string | null | undefined): string => {
  if (!id) {
    return '';
  }

  return `asset://icons/${id}`;
};

export const defaultEmojis = {
  like: '01jhzbzam4bv3y6xrgmfdeaj5jem',
  hand: '01jhzbzacgh2sns93j4xs950qsem',
  heart: '01jhzbzkn0k4dxkfrde8wgzqndem',
  check: '01jhzbzxy20g741m6j20macc2kem',
};

export const defaultIcons = {
  chat: '01jhzfk352deq95my1emrfqe0ric',
  book: '01jhzfk3fzvn546z2n2evb7ajnic',
  database: '01jhzfk3d19d8enym86tat3ybeic',
  bookmark: '01jhzfk3g4q40x7927qcm0hrjdic',
  folder: '01jhzfk3jrgc276z2gdabm4cwmic',
  apps: '01jhzfk4m7djqd1pw0e1671cmric',
};
