<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Admin;

use App\Auth\Domain\User\User;
use Sonata\AdminBundle\Admin\AbstractAdmin;
use Sonata\AdminBundle\Datagrid\DatagridMapper;
use Sonata\AdminBundle\Datagrid\ListMapper;
use Sonata\AdminBundle\Route\RouteCollectionInterface;
use Symfony\Component\DependencyInjection\Attribute\AutoconfigureTag;

/**
 * @extends AbstractAdmin<User>
 */
#[AutoconfigureTag('sonata.admin', [
    'manager_type' => 'orm',
    'group' => 'Konta',
    'label' => 'Użytkownicy',
    'code' => 'auth.user',
    'model_class' => User::class,
])]
final class UserAdmin extends AbstractAdmin
{
    protected function configureDatagridFilters(DatagridMapper $filter): void
    {
        $filter->add('email');
    }

    protected function configureListFields(ListMapper $list): void
    {
        $list
            ->addIdentifier('email', 'email')
            ->add('roles', 'array')
            ->add('createdAt', 'datetime', ['format' => 'Y-m-d H:i']);
    }

    protected function configureRoutes(RouteCollectionInterface $collection): void
    {
        $collection->remove('create');
        $collection->remove('edit');
    }

    protected function generateBaseRouteName(bool $isChildAdmin = false): string
    {
        return 'admin_auth_user';
    }

    protected function generateBaseRoutePattern(bool $isChildAdmin = false): string
    {
        return 'auth/user';
    }
}
