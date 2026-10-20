FROM php:8.4-fpm-alpine

# intl/zip linkują do tych bibliotek w runtime — bez nich się nie ładują.
RUN apk add --no-cache icu-libs libzip

RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev libzip-dev \
    && docker-php-ext-install pdo_mysql intl zip opcache \
    && apk del .build-deps

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
