-- ============================================================================
-- K.K. Tour — Idempotent Seed Migration for 10 Real Tours (RU / KZ / EN)
-- ============================================================================

DO $$
DECLARE
    v_tour_id UUID;
BEGIN

    -- ------------------------------------------------------------------------
    -- 1. kolsay-2days
    -- ------------------------------------------------------------------------
    INSERT INTO public.tours (slug, price, rating, photo, duration_days, category, featured, featured_order, status)
    VALUES (
        'kolsay-2days', 28500, 4.99, 'assets/images/album_lake.jpg', 2, 'lakes', true, 1, 'published'
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price,
        rating = EXCLUDED.rating,
        photo = EXCLUDED.photo,
        duration_days = EXCLUDED.duration_days,
        category = EXCLUDED.category,
        featured = EXCLUDED.featured,
        featured_order = EXCLUDED.featured_order,
        status = EXCLUDED.status,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_tour_id;

    -- RU
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'ru',
        '2 дня / 6 локаций: Кольсай, Каинды, Чарын',
        'Хит сезона! Озёра Кольсай и Каинды с затонувшим лесом, Чёрный и Лунный каньоны, река Шарын и урочище Куртогай.',
        'Самый популярный тур выходного дня из Алматы! За 2 насыщенных дня вы посетите 6 легендарных природных локаций: жемчужину Тянь-Шаня озеро Кольсай, мистическое озеро Каинды с затопленным еловым лесом, грандиозный Чарынский каньон (Долина Замков), Чёрный и Лунный каньоны, а также смотровую площадку урочища Куртогай. Ночёвка в уютных гостевых домах посёлка Саты с вкуснейшим домашним питанием.',
        '2 дня / 1 ночь', 'Суббота – Воскресенье', 'ТОП Выбор'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label,
        days_label = EXCLUDED.days_label,
        badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- KZ
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'kz',
        '2 күн / 6 локация: Көлсай, Қайыңды, Шарын',
        'Жыл хиті! Көлсай көлдері, су астындағы қарағайлары бар сырлы Қайыңды, Қара және Ай шатқалдары, Шарын өзені және Құртоғай.',
        'Алматыдан демалыс күндеріне арналған ең танымал тур! 2 күн ішінде сіз 6 аты аңызға айналған табиғи мекенді көресіз: Тянь-Шань жауһары Көлсай көлі, су астындағы қарағайлы қайталанбас Қайыңды көлі, Шарын шатқалы (Қамалдар аңғары), Қара және Ай шатқалдары, сондай-ақ Құртоғай панорамасы. Саты ауылындағы жайлы қонақ үйлерде қону және дәмді ұлттық тағамдар.',
        '2 күн / 1 түн', 'Сенбі – Жексенбі', 'ҮЗДІК ТАҢДАУ'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label,
        days_label = EXCLUDED.days_label,
        badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- EN
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'en',
        '2 Days / 6 Locations: Kolsay, Kaindy, Charyn',
        'Top hit! Kolsay & Kaindy lakes with submerged forest, Black & Moon Canyons, Charyn river and Kurtogay viewpoint.',
        'The most popular weekend tour from Almaty! In 2 eventful days you will explore 6 legendary locations: pearl of Tien Shan Kolsay Lake, mystical sunken forest Kaindy Lake, grand Charyn Canyon (Valley of Castles), Black & Moon Canyons, and scenic Kurtogay viewpoint. Cozy overnight stay at Saty village guest houses with hearty home-cooked meals.',
        '2 days / 1 night', 'Saturday – Sunday', 'TOP CHOICE'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label,
        days_label = EXCLUDED.days_label,
        badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- Includes
    DELETE FROM public.tour_includes WHERE tour_id = v_tour_id;
    INSERT INTO public.tour_includes (tour_id, language, text, sort_order) VALUES
        (v_tour_id, 'ru', 'Комфортабельный трансфер (Mercedes Sprinter)', 1),
        (v_tour_id, 'ru', 'Проживание в гостевых домах в пос. Саты', 2),
        (v_tour_id, 'ru', 'Вкусное домашнее питание (ужин, завтрак, обед)', 3),
        (v_tour_id, 'ru', 'Все входные билеты и эко-сборы во все нацпарки', 4),
        (v_tour_id, 'ru', 'Услуги опытного гида-экскурсовода', 5),
        (v_tour_id, 'ru', 'Экскурсии по каньонам и озёрам', 6),

        (v_tour_id, 'kz', 'Mercedes Sprinter-мен екі жаққа трансфер', 1),
        (v_tour_id, 'kz', 'Саты ауылындағы жайлы қонақ үйлерде тұру', 2),
        (v_tour_id, 'kz', 'Толыққанды тамақтану (кешкі ас, таңғы ас, түскі ас)', 3),
        (v_tour_id, 'kz', 'Барлық ұлттық парктердің эко-алымдары', 4),
        (v_tour_id, 'kz', 'Кәсіби гид-экскурсовод қызметі', 5),
        (v_tour_id, 'kz', 'Шатқалдар мен көлдерге қызықты экскурсиялар', 6),

        (v_tour_id, 'en', 'Comfortable round-trip transport (Mercedes Sprinter)', 1),
        (v_tour_id, 'en', 'Accommodation in Saty village guest houses', 2),
        (v_tour_id, 'en', 'Delicious home-cooked meals (dinner, breakfast, lunch)', 3),
        (v_tour_id, 'en', 'All national park entrance & eco-fees included', 4),
        (v_tour_id, 'en', 'Professional English/Russian speaking tour guide', 5),
        (v_tour_id, 'en', 'Guided canyon and lake walking tours', 6);


    -- ------------------------------------------------------------------------
    -- 2. assy-sunset
    -- ------------------------------------------------------------------------
    INSERT INTO public.tours (slug, price, rating, photo, duration_days, category, featured, featured_order, status)
    VALUES (
        'assy-sunset', 16500, 5.00, 'assets/images/album_mountains.jpg', 1, 'mountains', true, 2, 'published'
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price,
        rating = EXCLUDED.rating,
        photo = EXCLUDED.photo,
        duration_days = EXCLUDED.duration_days,
        category = EXCLUDED.category,
        featured = EXCLUDED.featured,
        featured_order = EXCLUDED.featured_order,
        status = EXCLUDED.status,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_tour_id;

    -- RU
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'ru',
        'Плато Асы + Медвежий водопад (Закат)',
        'Панорамы высокогорного плато Асы, древняя астрофизическая обсерватория, чистейший воздух и живописный Медвежий водопад.',
        'Погрузитесь в марсианские и космические пейзажи высокогорного плато Асы на высоте 2750 метров! Мы посетим знаменитую астрофизическую обсерваторию Асы-Тургень, живописный Медвежий водопад (высота 30 м) в Тургенском ущелье, сделаем шикарные снимки на закате солнца над горными хребтами и устроим высокогорный пикник.',
        '1 день (Джип-тур / Спринтер)', 'Каждую субботу и воскресенье', 'Эко-тур'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- KZ
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'kz',
        'Асы үстірті + Аюлы сарқырама (Күн батуы)',
        'Биік таулы Асы үстіртінің ғарыштық панорамасы, көне астрофизикалық обсерватория және көрікті Аюлы сарқырамасы.',
        '2750 метр биіктіктегі Асы үстіртінің ғарыштық табиғатын тамашалаңыз! Түрген шатқалындағы 30 метрлік Аюлы сарқырамасын көріп, Асы-Түрген астрофизикалық обсерваториясына барамыз, күннің батуында керемет суреттерге түсіп, таза тау ауасында демаламыз.',
        '1 күн (Джип-тур / Спринтер)', 'Әр сенбі және жексенбі', 'Эко-тур'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- EN
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'en',
        'Assy Plateau + Bear Waterfall (Sunset)',
        'Cosmic highlands at 2,750m elevation, historic Assy-Turgen astrophysics observatory, and Bear waterfall.',
        'Marvel at the breathtaking Martian-like scenery of high-altitude Assy Plateau! Visit the iconic Assy-Turgen Observatory, the 30-meter Bear Waterfall in Turgen Gorge, capture unreal golden hour sunset photos over the mountains, and enjoy an alpine picnic.',
        '1 day (Jeep / Sprinter)', 'Every Saturday & Sunday', 'Eco-tour'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- Includes
    DELETE FROM public.tour_includes WHERE tour_id = v_tour_id;
    INSERT INTO public.tour_includes (tour_id, language, text, sort_order) VALUES
        (v_tour_id, 'ru', 'Комфортабельный транспорт (Алматы — Асы — Алматы)', 1),
        (v_tour_id, 'ru', 'Входные билеты в Иле-Алатауский нацпарк', 2),
        (v_tour_id, 'ru', 'Пешая прогулка к Медвежьему водопаду', 3),
        (v_tour_id, 'ru', 'Экскурсия к обсерватории Асы-Тургень', 4),
        (v_tour_id, 'ru', 'Сопровождение опытного гида', 5),
        (v_tour_id, 'ru', 'Встреча заката на высокогорном плато', 6),

        (v_tour_id, 'kz', 'Ыңғайлы көлік (Алматы — Асы — Алматы)', 1),
        (v_tour_id, 'kz', 'Іле-Алатау ұлттық паркіне кіру билеттері', 2),
        (v_tour_id, 'kz', 'Аюлы сарқырамасына жаяу серуен', 3),
        (v_tour_id, 'kz', 'Асы-Түрген обсерваториясына экскурсия', 4),
        (v_tour_id, 'kz', 'Тәжірибелі гид сүйемелдеуі', 5),
        (v_tour_id, 'kz', 'Биік таулы үстіртте күннің батуын тамашалау', 6),

        (v_tour_id, 'en', 'Comfortable round-trip transport from Almaty', 1),
        (v_tour_id, 'en', 'Ile-Alatau National Park entrance & eco-fees', 2),
        (v_tour_id, 'en', 'Guided scenic hike to Bear Waterfall (30m)', 3),
        (v_tour_id, 'en', 'Excursion to the Assy-Turgen Observatory', 4),
        (v_tour_id, 'en', 'Experienced bilingual mountain guide', 5),
        (v_tour_id, 'en', 'Sunset sightseeing on the plateau', 6);


    -- ------------------------------------------------------------------------
    -- 3. kolsay-1day
    -- ------------------------------------------------------------------------
    INSERT INTO public.tours (slug, price, rating, photo, duration_days, category, featured, featured_order, status)
    VALUES (
        'kolsay-1day', 14000, 4.96, 'assets/images/album_waterfall.jpg', 1, 'lakes', true, 3, 'published'
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price, rating = EXCLUDED.rating, photo = EXCLUDED.photo,
        duration_days = EXCLUDED.duration_days, category = EXCLUDED.category,
        featured = EXCLUDED.featured, featured_order = EXCLUDED.featured_order,
        status = EXCLUDED.status, updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_tour_id;

    -- RU
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'ru',
        'Жемчужины Семиречья: 1 день / 6 локаций',
        'Озеро Кольсай, величественный Чарынский каньон (Долина Замков), Чёрный каньон и панорамные точки.',
        'Экспресс-программа для тех, кто хочет увидеть главные красоты Казахстана за один насыщенный день! Озеро Кольсай-1, легендарный Чарынский каньон (Долина Замков), Чёрный каньон, панорамы урочища Куртогай и реки Шарын.',
        '1 день (Экспресс)', 'Выезды каждую неделю', 'Экспресс'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- KZ
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'kz',
        'Жетісу жауһарлары: 1 күн / 6 локация',
        'Бір күнде максималды әсер: Көлсай көлі, керемет Шарын шатқалы Қамалдар аңғары, Қара шатқал және панорамалық нүктелер.',
        'Қазақстанның басты көрікті жерлерін 1 күн ішінде көруге арналған экспресс-бағдарлама! Көлсай-1 көлінің сұлулығы, Шарын өзеніне дейінгі Қамалдар аңғары, Қара және Ай шатқалдарының панорамалық нүктелері.',
        '1 күн (Экспресс)', 'Әр апта сайын', 'Экспресс'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- EN
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'en',
        'Pearls of Semirechye: 1 Day Express',
        'Kolsay Lake, grand Charyn Canyon (Valley of Castles), Black Canyon and panoramic lookouts in 1 day.',
        'The ultimate 1-day express itinerary for travelers tight on schedule. Explore turquoise Kolsay Lake, hike the Valley of Castles in Charyn Canyon, and take in the sheer drop views of Black & Moon Canyons.',
        '1 day (Express)', 'Weekly departures', 'Express'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- Includes
    DELETE FROM public.tour_includes WHERE tour_id = v_tour_id;
    INSERT INTO public.tour_includes (tour_id, language, text, sort_order) VALUES
        (v_tour_id, 'ru', 'Трансфер туда и обратно на спринтере', 1),
        (v_tour_id, 'ru', 'Эко-сборы нацпарков Кольсай и Чарын', 2),
        (v_tour_id, 'ru', 'Услуги профессионального гида', 3),
        (v_tour_id, 'ru', 'Экскурсии по каньону и озеру', 4),
        (v_tour_id, 'ru', 'Панорамные смотровые площадки каньонов', 5),

        (v_tour_id, 'kz', 'Микроавтобуспен екі жаққа трансфер', 1),
        (v_tour_id, 'kz', 'Көлсай және Шарын нацпарктерінің эко-алымдары', 2),
        (v_tour_id, 'kz', 'Кәсіби гид-экскурсовод қызметі', 3),
        (v_tour_id, 'kz', 'Шарын шатқалы мен Көлсайдағы серуен', 4),
        (v_tour_id, 'kz', 'Шатқалдардың панорамалық шолу алаңдары', 5),

        (v_tour_id, 'en', 'Round-trip Sprinter transfer from Almaty', 1),
        (v_tour_id, 'en', 'Kolsay and Charyn national park entrance fees', 2),
        (v_tour_id, 'en', 'Professional tour guide service', 3),
        (v_tour_id, 'en', 'Guided excursions at Charyn Canyon & Kolsay Lake', 4),
        (v_tour_id, 'en', 'Panoramic canyon viewpoints', 5);


    -- ------------------------------------------------------------------------
    -- 4. turkestan-2days
    -- ------------------------------------------------------------------------
    INSERT INTO public.tours (slug, price, rating, photo, duration_days, category, featured, featured_order, status)
    VALUES (
        'turkestan-2days', 38000, 4.95, 'assets/images/album_camp.jpg', 2, 'history', true, 4, 'published'
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price, rating = EXCLUDED.rating, photo = EXCLUDED.photo,
        duration_days = EXCLUDED.duration_days, category = EXCLUDED.category,
        featured = EXCLUDED.featured, featured_order = EXCLUDED.featured_order,
        status = EXCLUDED.status, updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_tour_id;

    -- RU
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'ru',
        'Исторический Юг: Туркестан и Отырар',
        'Мавзолей Ходжи Ахмеда Ясави, городище Отырар, древний Сауран и комплекс Керуен-Сарай.',
        'Глубокое путешествие по древнему Шёлковому Пути. Вы увидите шедевр средневекового зодчества Мавзолей Ходжи Ахмеда Ясави (ЮНЕСКО), археологические раскопки городища Отырар, мавзолей Арыстан-Баб, древнюю крепость Сауран и вечернее водное шоу в комплексе Керуен-Сарай.',
        '2 дня / 1 ночь', 'По графику', 'История'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- KZ
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'kz',
        'Тарихи Оңтүстік: Түркістан және Отырар',
        'Қожа Ахмет Ясауи кесенесі, көне Отырар қалашығы, Сауран бекінісі және Керуен-Сарай кешені.',
        'Ұлы Жібек Жолының тарихына терең саяхат. ЮНЕСКО мұрасы Қожа Ахмет Ясауи кесенесі, көне Отырар қалашығы, Арыстан-Баб кесенесі, Сауран қамалы және заманауи «Керуен-Сарай» туристік кешеніндегі кешкі шоу.',
        '2 күн / 1 түн', 'Кесте бойынша', 'Тарих'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- EN
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'en',
        'Historical South: Turkestan & Otyrar',
        'Khoja Ahmed Yasawi Mausoleum (UNESCO), ancient Otyrar ruins, Sauran fortress and modern Keruen-Saray.',
        'Journey back along the Great Silk Road. Marvel at the UNESCO World Heritage Mausoleum of Khoja Ahmed Yasawi, visit the ancient citadel of Otrar, Arystan-Bab mausoleum, Sauran fortress walls, and the grand evening boat show at Keruen-Saray.',
        '2 days / 1 night', 'Scheduled departures', 'History'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- Includes
    DELETE FROM public.tour_includes WHERE tour_id = v_tour_id;
    INSERT INTO public.tour_includes (tour_id, language, text, sort_order) VALUES
        (v_tour_id, 'ru', 'Транспортное обслуживание по всему маршруту', 1),
        (v_tour_id, 'ru', 'Проживание в гостинице в Туркестане', 2),
        (v_tour_id, 'ru', 'Все входные билеты в музеи и мавзолеи', 3),
        (v_tour_id, 'ru', 'Услуги лицензированного гида-историка', 4),
        (v_tour_id, 'ru', 'Посещение шоу в комплексе Керуен-Сарай', 5),

        (v_tour_id, 'kz', 'Ыңғайлы көлік / пойыз трансфері', 1),
        (v_tour_id, 'kz', 'Түркістандағы қонақ үйде тұру', 2),
        (v_tour_id, 'kz', 'Мұражайлар мен кесенелердің барлық кіру билеттері', 3),
        (v_tour_id, 'kz', 'Сертификатталған тарихшы-гид қызметі', 4),
        (v_tour_id, 'kz', 'Керуен-Сарай кешеніне бару', 5),

        (v_tour_id, 'en', 'Full transportation during the tour', 1),
        (v_tour_id, 'en', 'Hotel accommodation in Turkestan', 2),
        (v_tour_id, 'en', 'All museum and mausoleum admission tickets', 3),
        (v_tour_id, 'en', 'Licensed historical tour guide', 4),
        (v_tour_id, 'en', 'Evening Keruen-Saray water show entrance', 5);


    -- ------------------------------------------------------------------------
    -- 5. issyk-lake
    -- ------------------------------------------------------------------------
    INSERT INTO public.tours (slug, price, rating, photo, duration_days, category, featured, featured_order, status)
    VALUES (
        'issyk-lake', 12500, 4.92, 'assets/images/album_lake.jpg', 1, 'lakes', true, 5, 'published'
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price, rating = EXCLUDED.rating, photo = EXCLUDED.photo,
        duration_days = EXCLUDED.duration_days, category = EXCLUDED.category,
        featured = EXCLUDED.featured, featured_order = EXCLUDED.featured_order,
        status = EXCLUDED.status, updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_tour_id;

    -- RU
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'ru',
        'Озеро Иссык + Форелевое хозяйство',
        'Изумрудное озеро Иссык, музей Золотого Человека, водопад и свежая форель на гриле.',
        'Лёгкая и красивая семейная поездка всего в 1.5 часах езды от Алматы. Изумрудное озеро Иссык в окружении тянь-шаньских елей, исторический музей с курганами Золотого Человека, горный водопад и вкуснейший обед со свежей форелью.',
        '1 день', 'Каждую субботу', 'Семейный'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- KZ
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'kz',
        'Есік көлі + Бақтақ шаруашылығы',
        'Зүбәржат Есік көлі, Алтын Адам мұражайы, сарқырама және грильде піскен балғын бақтақ.',
        'Алматыдан 1.5 сағаттық жердегі жеңіл әрі әсем отбасылық саяхат. Тянь-Шань шыршалары қоршаған зүбәржат Есік көлі, Алтын Адам табылған тарихи мұражай, тау сарқырамасы және бақтақ балығынан дәмді түскі ас.',
        '1 күн', 'Әр сенбі', 'Отбасылық'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- EN
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'en',
        'Issyk Lake + Trout Farm Experience',
        'Emerald alpine Issyk Lake, Golden Man historical museum, mountain waterfall, and freshly grilled trout.',
        'A pleasant, easy family-friendly day tour just 1.5 hours from Almaty. Visit turquoise Lake Issyk nestled in the gorge, the archaeological museum where the Golden Man warrior was unearthed, and enjoy a fresh trout lunch.',
        '1 day', 'Every Saturday', 'Family'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- Includes
    DELETE FROM public.tour_includes WHERE tour_id = v_tour_id;
    INSERT INTO public.tour_includes (tour_id, language, text, sort_order) VALUES
        (v_tour_id, 'ru', 'Трансфер из Алматы и обратно', 1),
        (v_tour_id, 'ru', 'Входные билеты на озеро Иссык и в музей', 2),
        (v_tour_id, 'ru', 'Услуги экскурсовода', 3),
        (v_tour_id, 'ru', 'Посещение музея и водопада', 4),

        (v_tour_id, 'kz', 'Алматыдан және кері көлік қызметі', 1),
        (v_tour_id, 'kz', 'Есік көлі мен мұражайдың кіру билеттері', 2),
        (v_tour_id, 'kz', 'Экскурсиялық гид қызметі', 3),
        (v_tour_id, 'kz', 'Мұражай мен сарқыраманы аралау', 4),

        (v_tour_id, 'en', 'Round-trip transport from Almaty', 1),
        (v_tour_id, 'en', 'Issyk Lake & Golden Man museum tickets', 2),
        (v_tour_id, 'en', 'Guided tour escort', 3),
        (v_tour_id, 'en', 'Museum and waterfall walk', 4);


    -- ------------------------------------------------------------------------
    -- 6. bao-trek
    -- ------------------------------------------------------------------------
    INSERT INTO public.tours (slug, price, rating, photo, duration_days, category, featured, featured_order, status)
    VALUES (
        'bao-trek', 10500, 4.97, 'assets/images/album_mountains.jpg', 1, 'lakes', true, 6, 'published'
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price, rating = EXCLUDED.rating, photo = EXCLUDED.photo,
        duration_days = EXCLUDED.duration_days, category = EXCLUDED.category,
        featured = EXCLUDED.featured, featured_order = EXCLUDED.featured_order,
        status = EXCLUDED.status, updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_tour_id;

    -- RU
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'ru',
        'БАО (Большое Алматинское Озеро)',
        'Бирюзовое высокогорное зеркало в окружении пиков Заилийского Алатау и ущелье Алма-Арасан.',
        'Главная визитная карточка Алматы на высоте 2500 метров над уровнем моря. Кристально бирюзовая вода, панорамные виды на пики Советов и Озёрный, целебные источники Алма-Арасана и фотосессия на смотровых точках.',
        '1 день', 'Вторник, Четверг, Суббота', 'Хит'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- KZ
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'kz',
        'ҮАҮ (Үлкен Алматы Көлі)',
        'Іле Алатауының шыңдары қоршаған биік таулы көгілдір көл және Алма-Арасан шатқалы.',
        'Алматының басты інжу-маржаны — теңіз деңгейінен 2500 метр биіктіктегі Үлкен Алматы Көліне саяхат. Мөлдір көгілдір су, Советов, Озерный шыңдарының көрінісі және Алма-Арасан шатқалының сауықтыру бұлақтары.',
        '1 күн', 'Сейсенбі, Бейсенбі, Сенбі', 'Хит'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- EN
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'en',
        'Big Almaty Lake (BAO)',
        'Turquoise alpine reservoir at 2,500m surrounded by towering Tien Shan mountain peaks.',
        'Almaty iconic landmark nestled at 2,500 meters altitude. Enjoy dazzling turquoise waters reflecting snow-capped peaks, alpine air, and a stop at Alma-Arasan thermal springs.',
        '1 day', 'Tuesday, Thursday, Saturday', 'Hit'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- Includes
    DELETE FROM public.tour_includes WHERE tour_id = v_tour_id;
    INSERT INTO public.tour_includes (tour_id, language, text, sort_order) VALUES
        (v_tour_id, 'ru', 'Эко-трансфер из Алматы и обратно', 1),
        (v_tour_id, 'ru', 'Эко-сборы Иле-Алатауского нацпарка', 2),
        (v_tour_id, 'ru', 'Сопровождение гида', 3),
        (v_tour_id, 'ru', 'Лучшие панорамные смотровые площадки', 4),

        (v_tour_id, 'kz', 'Алматыдан эко-трансфер', 1),
        (v_tour_id, 'kz', 'Іле-Алатау нацпаркінің эко-алымы', 2),
        (v_tour_id, 'kz', 'Гидпен бірге серуен', 3),
        (v_tour_id, 'kz', 'Үздік панорамалық шолу алаңдары', 4),

        (v_tour_id, 'en', 'Round-trip eco-transport from Almaty', 1),
        (v_tour_id, 'en', 'National park environmental permits', 2),
        (v_tour_id, 'en', 'Professional guide', 3),
        (v_tour_id, 'en', 'Panoramic scenic viewpoints', 4);


    -- ------------------------------------------------------------------------
    -- 7. assy-camping
    -- ------------------------------------------------------------------------
    INSERT INTO public.tours (slug, price, rating, photo, duration_days, category, featured, featured_order, status)
    VALUES (
        'assy-camping', 28000, 4.98, 'assets/images/album_camp.jpg', 2, 'mountains', false, 7, 'published'
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price, rating = EXCLUDED.rating, photo = EXCLUDED.photo,
        duration_days = EXCLUDED.duration_days, category = EXCLUDED.category,
        featured = EXCLUDED.featured, featured_order = EXCLUDED.featured_order,
        status = EXCLUDED.status, updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_tour_id;

    -- RU
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'ru',
        'Ночёвка на Плато Асы + Кемпинг & Звёзды',
        'Ночь под миллиардами звёзд в палатках на высоте 2750м, костёр, закат и рассвет в горах.',
        'Незабываемое приключение для романтиков и любителей первозданной природы. Палаточный лагерь на плато Асы, наблюдение за Млечным Путем возле обсерватории, песни у костра, горячий чай на травах и волшебный рассвет над горными хребтами.',
        '2 дня / 1 ночь', 'Пятница – Суббота, Суббота – Воскресенье', 'Кемпинг'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- KZ
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'kz',
        'Асы үстіртінде түнеу + Кемпинг & Жұлдыздар',
        '2750м биіктіктегі шатырда жұлдыздар астындағы түн, алау, таудағы күннің батуы мен таңғы шапағы.',
        'Нағыз табиғат сүйер қауымға арналған шатырлы саяхат. Асы үстіртіндегі жайлы кемпинг, обсерватория жанындағы түнгі жұлдызды аспан, алау маңындағы әңгімелер және таңғы тау самалы.',
        '2 күн / 1 түн', 'Жұма – Сенбі, Сенбі – Жексенбі', 'Кемпинг'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- EN
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'en',
        'Assy Plateau Overnight Stargazing & Camping',
        'Camp under millions of stars at 2,750m, campfire, Milky Way astrophotography, and sunrise over peaks.',
        'An unforgettable alpine wilderness experience. Fully equipped tent campsite on Assy plateau, Milky Way stargazing next to the observatory, campfire dinner, and surreal golden sunrise.',
        '2 days / 1 night', 'Friday–Saturday, Saturday–Sunday', 'Camping'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- Includes
    DELETE FROM public.tour_includes WHERE tour_id = v_tour_id;
    INSERT INTO public.tour_includes (tour_id, language, text, sort_order) VALUES
        (v_tour_id, 'ru', 'Трансфер на подготовленном транспорте', 1),
        (v_tour_id, 'ru', 'Палатки, карематы, спальные мешки', 2),
        (v_tour_id, 'ru', 'Походное горячее питание и костёр', 3),
        (v_tour_id, 'ru', 'Все эко-сборы нацпарка', 4),
        (v_tour_id, 'ru', 'Наблюдение за звёздным небом', 5),

        (v_tour_id, 'kz', 'Көлік трансфері', 1),
        (v_tour_id, 'kz', 'Шатырлар, карематтар және ұйықтайтын қаптар', 2),
        (v_tour_id, 'kz', 'Ыстық походтық тамақтану', 3),
        (v_tour_id, 'kz', 'Ұлттық парктің эко-алымдары', 4),
        (v_tour_id, 'kz', 'Түнгі жұлдызды аспанды бақылау', 5),

        (v_tour_id, 'en', 'Round-trip 4WD transport', 1),
        (v_tour_id, 'en', 'Full camping gear (tents, sleeping bags, mats)', 2),
        (v_tour_id, 'en', 'Hot campfire dinner & breakfast', 3),
        (v_tour_id, 'en', 'National park environmental fees', 4),
        (v_tour_id, 'en', 'Stargazing under night skies', 5);


    -- ------------------------------------------------------------------------
    -- 8. horse-tour
    -- ------------------------------------------------------------------------
    INSERT INTO public.tours (slug, price, rating, photo, duration_days, category, featured, featured_order, status)
    VALUES (
        'horse-tour', 18000, 4.99, 'assets/images/album_mountains.jpg', 1, 'mountains', false, 8, 'published'
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price, rating = EXCLUDED.rating, photo = EXCLUDED.photo,
        duration_days = EXCLUDED.duration_days, category = EXCLUDED.category,
        featured = EXCLUDED.featured, featured_order = EXCLUDED.featured_order,
        status = EXCLUDED.status, updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_tour_id;

    -- RU
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'ru',
        'Конный тур на закате в ущелье Ой-Карагай',
        'Конная прогулка по горным тропам, инструктаж для новичков, свежий хвойный воздух и чай у юрты.',
        'Почувствуйте дух кочевой свободы! Спокойные обученные лошади, сопровождение опытных инструкторов, живописные тропы среди тянь-шаньских елей и фотосессия верхом на фоне заката.',
        '1 день (3–4 часа верхом)', 'Ежедневно', 'Релакс'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- KZ
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'kz',
        'Ой-Қарағай шатқалындағы атпен серуен',
        'Тау соқпақтарымен атпен серуендеу, жаңадан бастаушыларға арналған нұсқаулық және киіз үй жанындағы шай.',
        'Көшпенділер рухын сезініңіз! Арнайы үйретілген жуас жылқылар, кәсіби нұсқаушылар, шыршалы тау бөктері және күннің батуындағы керемет фотолар.',
        '1 күн (3–4 сағат ат үстінде)', 'Күн сайын', 'Релакс'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- EN
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'en',
        'Sunset Horseback Riding Tour in Oi-Qaragai',
        'Scenic equestrian trail ride in the Tien Shan mountains, gentle horses, beginner friendly, alpine tea.',
        'Experience true nomadic freedom riding well-trained mountain horses along pristine pine forest trails with experienced equestrians and enjoy sunset photos on horseback.',
        '1 day (3-4 hours ride)', 'Daily', 'Relax'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- Includes
    DELETE FROM public.tour_includes WHERE tour_id = v_tour_id;
    INSERT INTO public.tour_includes (tour_id, language, text, sort_order) VALUES
        (v_tour_id, 'ru', 'Трансфер от офиса K.K. Tour', 1),
        (v_tour_id, 'ru', 'Аренда обученной лошади и шлема', 2),
        (v_tour_id, 'ru', 'Сопровождение опытного инструктора', 3),
        (v_tour_id, 'ru', 'Чай из горных трав и угощения', 4),
        (v_tour_id, 'ru', 'Фотосессия верхом', 5),

        (v_tour_id, 'kz', 'K.K. Tour кеңсесінен трансфер', 1),
        (v_tour_id, 'kz', 'Атты және қорғаныс каскасын жалға алу', 2),
        (v_tour_id, 'kz', 'Тәжірибелі нұсқаушы сүйемелдеуі', 3),
        (v_tour_id, 'kz', 'Тау шөптерінен шай', 4),
        (v_tour_id, 'kz', 'Ат үстіндегі фотосессия', 5),

        (v_tour_id, 'en', 'Round-trip transport from Almaty office', 1),
        (v_tour_id, 'en', 'Horse rental & safety helmet', 2),
        (v_tour_id, 'en', 'Professional equestrian instructor', 3),
        (v_tour_id, 'en', 'Herbal alpine tea & treats', 4),
        (v_tour_id, 'en', 'Photo session on horseback', 5);


    -- ------------------------------------------------------------------------
    -- 9. kyrgyzstan
    -- ------------------------------------------------------------------------
    INSERT INTO public.tours (slug, price, rating, photo, duration_days, category, featured, featured_order, status)
    VALUES (
        'kyrgyzstan', 35000, 4.96, 'assets/images/album_lake.jpg', 2, 'mountains', false, 9, 'published'
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price, rating = EXCLUDED.rating, photo = EXCLUDED.photo,
        duration_days = EXCLUDED.duration_days, category = EXCLUDED.category,
        featured = EXCLUDED.featured, featured_order = EXCLUDED.featured_order,
        status = EXCLUDED.status, updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_tour_id;

    -- RU
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'ru',
        'Кыргызстан: Ущелье Чункурчак и Бишкек',
        'Живописные ущелья Кыргызстана, подвесной мост над каньоном, водопады и восточный колорит Бишкека.',
        'Двухдневное путешествие в соседний Кыргызстан. Вы посетите головокружительное ущелье Чункурчак, пройдёте по подвесному мосту над пропастью, увидите Голубиный водопад, попробуете национальные кыргызские блюда и прогуляетесь по площади Ала-Тоо в Бишкеке.',
        '2 дня / 1 ночь', 'По набору группы', 'Зарубежный'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- KZ
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'kz',
        'Қырғызстан: Шұңқыршақ шатқалы & Бішкек',
        'Көршілес Қырғызстанның көркем шатқалдары, каньон үстіндегі аспалы көпір, сарқырамалар және Бішкек қаласы.',
        'Көрші елге 2 күндік қызықты саяхат. Шұңқыршақ шатқалының табиғаты, құз үстіндегі аспалы көпір, Көгершін сарқырамасы, дәмді қырғыз тағамдары және Бішкек орталығындағы Ала-Тоо алаңы.',
        '2 күн / 1 түн', 'Топ жиналуына байланысты', 'Шетелдік'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- EN
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'en',
        'Kyrgyzstan: Chunkurchak Gorge & Bishkek',
        'Spectacular gorges of Kyrgyzstan, suspension bridge over canyon, mountain waterfalls & Bishkek city.',
        '2-day international getaway to Kyrgyzstan. Walk across the thrilling suspension sky bridge in Chunkurchak Gorge, hike to Pigeon Waterfall, taste traditional Kyrgyz cuisine and explore Ala-Too central square in Bishkek.',
        '2 days / 1 night', 'Group based schedule', 'International'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- Includes
    DELETE FROM public.tour_includes WHERE tour_id = v_tour_id;
    INSERT INTO public.tour_includes (tour_id, language, text, sort_order) VALUES
        (v_tour_id, 'ru', 'Международный трансфер (Алматы — Бишкек — Чункурчак)', 1),
        (v_tour_id, 'ru', 'Проживание в отеле в Бишкеке', 2),
        (v_tour_id, 'ru', 'Входные билеты и проход на подвесной мост', 3),
        (v_tour_id, 'ru', 'Сопровождение гида на всём маршруте', 4),
        (v_tour_id, 'ru', 'Экскурсионная программа', 5),

        (v_tour_id, 'kz', 'Халықаралық трансфер (Алматы — Бішкек — Шұңқыршақ)', 1),
        (v_tour_id, 'kz', 'Бішкектегі қонақ үйде тұру', 2),
        (v_tour_id, 'kz', 'Аспалы көпірге кіру билеттері', 3),
        (v_tour_id, 'kz', 'Гид қызметі', 4),
        (v_tour_id, 'kz', 'Экскурсиялық бағдарлама', 5),

        (v_tour_id, 'en', 'Cross-border transport (Almaty–Bishkek–Chunkurchak)', 1),
        (v_tour_id, 'en', 'Hotel accommodation in Bishkek', 2),
        (v_tour_id, 'en', 'Suspension bridge entrance tickets', 3),
        (v_tour_id, 'en', 'Full-time tour leader & guide', 4),
        (v_tour_id, 'en', 'Sightseeing excursion program', 5);


    -- ------------------------------------------------------------------------
    -- 10. custom
    -- ------------------------------------------------------------------------
    INSERT INTO public.tours (slug, price, rating, photo, duration_days, category, featured, featured_order, status)
    VALUES (
        'custom', 25000, 5.00, 'assets/images/album_camp.jpg', 1, 'custom', false, 10, 'published'
    )
    ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price, rating = EXCLUDED.rating, photo = EXCLUDED.photo,
        duration_days = EXCLUDED.duration_days, category = EXCLUDED.category,
        featured = EXCLUDED.featured, featured_order = EXCLUDED.featured_order,
        status = EXCLUDED.status, updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_tour_id;

    -- RU
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'ru',
        'Индивидуальный тур под ключ',
        'Маршрут любой сложности по вашим пожеланиям: джипы, вертолёты, VIP-гостевые дома, тимбилдинги.',
        'Разработаем персональный эксклюзивный маршрут для вашей семьи, компании друзей или корпоративного тимбилдинга. Выберите любые локации Казахстана, даты, транспорт и формат питания — K.K. Tour организует всё на высшем уровне.',
        'Любая длительность', 'В любой удобный день', 'VIP'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- KZ
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'kz',
        'Жеке (индивидуалды) тур',
        'Сіздің қалауыңыз бойынша кез келген бағыт: джиптер, премиум қонақ үйлер, тимбилдингтер.',
        'Отбасыңызға немесе ұжымыңызға арналған арнайы жеке тур. Кез келген бағытты, күнді және көлік түрін таңдаңыз — K.K. Tour сапалы түрде ұйымдастырып береді.',
        'Кез келген ұзақтық', 'Кез келген ыңғайлы күн', 'VIP'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- EN
    INSERT INTO public.tour_translations (tour_id, language, name, description, full_description, duration_label, days_label, badge)
    VALUES (
        v_tour_id, 'en',
        'Tailor-Made Custom Tour',
        'Customized private adventures: 4WD off-road, helicopters, luxury chalets, corporate team buildings.',
        'Custom-crafted private journeys tailored specifically to your preferences. Choose any locations across Kazakhstan, departure dates, transport, and style — K.K. Tour takes care of every detail.',
        'Custom duration', 'Any chosen date', 'VIP'
    )
    ON CONFLICT (tour_id, language) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, full_description = EXCLUDED.full_description,
        duration_label = EXCLUDED.duration_label, days_label = EXCLUDED.days_label, badge = EXCLUDED.badge,
        updated_at = timezone('utc'::text, now());

    -- Includes
    DELETE FROM public.tour_includes WHERE tour_id = v_tour_id;
    INSERT INTO public.tour_includes (tour_id, language, text, sort_order) VALUES
        (v_tour_id, 'ru', 'Индивидуальный трансфер и персональный гид', 1),
        (v_tour_id, 'ru', 'Гибкая программа без привязки к группе', 2),
        (v_tour_id, 'ru', 'Все нацпарки и эко-сборы', 3),
        (v_tour_id, 'ru', 'Подбор питания и отелей по вашему запросу', 4),

        (v_tour_id, 'kz', 'Жеке трансфер және жеке гид', 1),
        (v_tour_id, 'kz', 'Топқа тәуелсіз еркін бағдарлама', 2),
        (v_tour_id, 'kz', 'Барлық нацпарктер мен алымдар', 3),
        (v_tour_id, 'kz', 'Тамақтану мен қонақ үйді таңдау', 4),

        (v_tour_id, 'en', 'Private transport & dedicated guide', 1),
        (v_tour_id, 'en', 'Completely flexible custom itinerary', 2),
        (v_tour_id, 'en', 'All park fees & permits', 3),
        (v_tour_id, 'en', 'Custom meal & accommodation arrangements', 4);

END $$;
