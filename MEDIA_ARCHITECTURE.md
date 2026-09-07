# La Vaca Loca Records media architecture

This project separates content from media storage so the public website, admin prototype, and future CMS can all use the same structure.

## Local asset paths

Use these paths when files live inside the GitHub Pages repository:

```text
assets/images/site/hero-store.jpg
assets/images/records/lvl001-cover.jpg
assets/images/sessions/s01-hero.jpg
assets/images/events/fiesta-caliente-poster.jpg
assets/images/archive/la-casa.jpg
assets/audio/previews/lvl001-preview.mp3
assets/audio/sessions/s03-set.mp3
```

## External media URLs

Use full URLs when files are stored outside GitHub, such as Cloudinary or Supabase Storage:

```text
https://res.cloudinary.com/account/image/upload/v1/la-vaca-loca/records/lvl001-cover.jpg
https://project.supabase.co/storage/v1/object/public/media/audio/previews/lvl001-preview.mp3
```

## Record audio model

Record previews should usually be short MP3 files:

```js
audioType: 'file',
audioPreview: 'assets/audio/previews/lvl001-preview.mp3',
youtubeUrl: '',
media: {
  audio: {
    sourceType: 'file',
    path: 'assets/audio/previews/lvl001-preview.mp3',
    url: '',
    youtubeUrl: '',
    youtubeId: '',
    title: 'After Hours preview'
  }
}
```

Use YouTube only when the source is a video or long session:

```js
audioType: 'youtube',
audioPreview: '',
youtubeUrl: 'https://www.youtube.com/watch?v=VIDEO_ID',
media: {
  audio: {
    sourceType: 'youtube',
    path: '',
    url: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=VIDEO_ID',
    youtubeId: 'VIDEO_ID',
    title: 'Session video'
  }
}
```

## Recommended storage split

- GitHub Pages: frontend code only.
- Cloudinary: artwork, photos, posters, optimized images.
- Supabase: database, admin login, records, events, sessions, settings, and possibly private/public storage.
- YouTube: long videos, DJ sets, interviews, sessions.
- MP3 files: short record previews only.

## Naming rules

Use lowercase, no spaces, and predictable IDs:

```text
lvl001-cover.jpg
lvl001-preview.mp3
s01-hero.jpg
fiesta-caliente-poster.jpg
la-casa.jpg
```
