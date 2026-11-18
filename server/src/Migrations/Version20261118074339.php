<?php

declare(strict_types=1);

namespace App\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261118074339 extends AbstractMigration
{
    #[\Override]
    public function getDescription(): string
    {
        return 'Konta Google i tokeny odświeżania sesji';
    }

    #[\Override]
    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE app_user ADD google_sub VARCHAR(255) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX uniq_app_user_google_sub ON app_user (google_sub)');
        $this->addSql('CREATE TABLE auth_refresh_token (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, hash VARCHAR(64) NOT NULL, family_id VARCHAR(64) NOT NULL, expires_at DATETIME NOT NULL, revoked_at DATETIME DEFAULT NULL, INDEX idx_refresh_token_family (family_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
    }

    #[\Override]
    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE auth_refresh_token');
        $this->addSql('DROP INDEX uniq_app_user_google_sub ON app_user');
        $this->addSql('ALTER TABLE app_user DROP google_sub');
    }
}
