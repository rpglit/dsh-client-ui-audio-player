# dsh-client-ui-audio-player

[English](README.md) | Русский

> **Третьясторонний пакет.** Это неофициальный community-пакет. Он не
> связан с DeepSeek, не одобрен и не поддерживается DeepSeek. Код вынесен
> (fork) из `packages/client/ui-audio-player` репозитория
> [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness)
> (коммит `fee78d97`, лицензия MIT). DeepSeek позже может опубликовать
> официальный пакет `@deepseek-ai/dsh-client-ui-audio-player` в scope
> `@deepseek-ai`; официальный scoped-пакет и этот unscoped-пакет имеют
> разные graph-id и разные id рендерера, так что технически они *могут*
> сосуществовать в одном профиле, — но профиль должен использовать либо
> один, либо другой, чтобы не было двух аудио-рендереров для одних и тех же
> расширений файлов.

## Что делает

Добавляет аудио-рендерер в предпросмотр документа правой панели (Sidebar)
веб-GUI DSH:

- заявляет расширения `mp3`, `wav`, `ogg`, `flac`, `m4a`, `aac`, `opus`;
- воспроизводит файл через нативный элемент
  `<audio controls preload="metadata">`;
- читает файл целиком **окнами по 2 MiB** через Remote
  `workspaceFiles.readBytes`, поэтому файлы больше лимита **32 MiB**
  целочтение на Host тоже воспроизводятся (окно, отклонённое как слишком
  большое, сжимается до лимита, который сообщает отклонение);
- проверка возможностей браузера `canPlayType` называет единственное
  состояние, невидимое Host — неподдерживаемый кодек, — и показывает
  подсказку «конвертируйте в MP3», а не сломанный плеер;
- добавляет русский язык (`ru`, с побазовым откатом на английский) как
  выбираемый язык, словарь этого пакета переведён.

Файл, который Host не может прочитать, показывает собственное состояние
ошибки предпросмотра; ошибка декодирования медиа после загрузки заменяет
плеер подсказкой о неподдерживаемом формате. Аудио-байты не покидают
браузер (Blob URL, отзывается при unmount).

## Установка

Требуется DSH `>=0.2.0 <0.3.0` (заявлено в `engines.dsh`; установка и
запуск профиля отклоняют bundle, диапазон которого выполняющий DSH не
удовлетворяет).

```sh
# из git (репозиторий содержит предсобранный lib/, поэтому разрешение на сборку не нужно)
dsh plugin --profile web add github:rpglit/dsh-client-ui-audio-player

# после публикации в npm
dsh plugin --profile web add dsh-client-ui-audio-player

# либо локальный checkout
dsh plugin --profile web add /path/to/dsh-client-ui-audio-player
```

`dsh plugin` управляет зависимостью в `package.json` профиля и добавляет
слой. Клиентскому плагину также нужна строка в roster: добавьте этот блок в
`cordis.patch.yml` профиля (`~/.dsh/profiles/web/cordis.patch.yml`) в виде
**топ-уровневого блока `- insert:`** (у новой строки пакета нет существующего
id, который можно было бы переопределить):

```yaml
- insert:
  - id: ui-audio-player
    name: 'dsh-client-ui-audio-player'
```

`id` — свободный ключ roster (оставлен `ui-audio-player`); `name` — это npm-имя,
и именно оно является идентичностью записи в module graph. Сохранение файла
вызывает пересборку профиля на месте — перезапуск сервера не нужен.

## Обновление

- **git-установка (горячий путь):** Host stat-опрашивает `lib/client.js`
  каждой строки графа каждые 500 мс, а ревизия записи основана на stat,
  поэтому `git pull` в установленной копии (обновляет закоммиченный `lib/`)
  подхватывается автоматически: новая ревизия → SSE-кадр `rebuilt` → браузер
  принимает изменения через HMR, без перезапуска.
- **любая установка (чистый путь):**
  ```sh
  dsh plugin --profile web remove dsh-client-ui-audio-player
  dsh plugin --profile web add <тот же источник, что и раньше>
  ```
  затем проверьте строку roster в `cordis.patch.yml`.

## Сборка из исходников

Node `^22.19.0 || >=24.0.0`; pnpm через corepack (в этой системе `pnpm` не в PATH):

```sh
corepack pnpm@12.11.2 install    # или: pnpm install
corepack pnpm@12.11.2 run build  # tsc -b tsconfig.json && tsdown → lib/
corepack pnpm@12.11.2 run bundle # только tsdown (ребандл по существующим lib/types)
corepack pnpm@12.11.2 run watch  # tsdown --watch
corepack pnpm@12.11.2 run smoke  # проверка артефакта: фабрика, stamped-id, размер — без браузера
```

Каталог `build/` содержит vendored-копию общего пресета `clientBundle`
tsdown из harness (7 файлов, MIT, attribution-шапки; перенаправлены только
импорты и `REPOSITORY_ROOT` — см. шапку каждого файла). Предсобранный `lib/`
**коммитится намеренно**: git-установка получает исходники без запуска каких
либо build-скриптов, а TypeScript-пакет без `lib/` не загрузится, — поэтому
бандл, который вы коммитите, и есть бандл, который обслуживает профиль.

## Тесты

`tests/audio-player.client.spec.tsx` — построчная reference-копия
upstream-спека. Она выполняется внутри монорепо `deepseek-harness` (импортирует
сабпуть `@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/…`, который
публикуемые tarball не содержат); standalone-проверка — `pnpm run smoke`.

## Откат

```sh
dsh plugin --profile web remove dsh-client-ui-audio-player
```

и удалите блок `- insert:` из `cordis.patch.yml` профиля. Пересборка профиля
уберёт запись графа на месте — без перезапуска.

## Влияние на модель

Нет. Это только браузерный просмотрщик: плагин не регистрирует ни тулов, ни
секций промпта, ни событий сессии; он лишь отрисовывает тело предпросмотра и
добавляет локальные строки.

## Лицензия

MIT. `src/`, `locale/` и `build/` происходят из `deepseek-ai/deepseek-harness`
(MIT, Copyright (c) 2026 DeepSeek); см. `LICENSE` и пофайловые шапки в
`build/`.
