from django.contrib import admin
from django.urls import path, include
from myapp.views import *
from django.conf.urls.static import static
from django.conf import settings
from django.contrib.auth.views import LoginView, LogoutView
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', intro, name='intro'),
    path('about/', about, name='about'),
    path('contact/', contact, name='contact'),
    path('help/', help, name='help'),
    path('getStarted/', getStarted, name='getStarted'),
    path('mainpage/', mainpage, name='mainpage'),
    path('home/', home, name='home'),
    path("my-projects/", my_projects, name="my-projects"),
    path("templates/", templates, name="templates"),
    path('screenshots/', screenshots, name='screenshots'),
    path("settings/", settings_view, name="settings"),
    path("createpage/<str:project_id>", createpage, name="createpage"),
    path('delete_project/<str:project_id>/', delete_project, name='delete_project'),
    path('edit_projects/<str:project_id>/', edit_projects, name='edit_projects'),
    path('save-room-design/<str:room_id>/', save_room_design, name='save_room_design'),
    path('get-room-design/<str:room_id>/', get_room_design, name='get_room_design'),
    path('save-screenshot/<str:project_id>/', save_screenshot, name='save-screenshot'),
    path('delete-room/<int:room_id>/', delete_room, name='delete_room'),
    path('check-screenshot/<str:project_id>/', check_screenshot, name='check-screenshot'),
    path('post-project/<str:room_id>/', post_project, name='post_project'),
    path('community/', community, name='community'),
    path('fadmin/', fadmin, name='fadmin'),
    path('admin_login/', admin_login, name='admin_login'),
    path('admin_logout/', admin_logout, name='admin_logout'),

      
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
