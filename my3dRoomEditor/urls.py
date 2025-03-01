from django.contrib import admin
from django.urls import path
from myapp.views import *
from django.conf.urls.static import static
from django.conf import settings

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
    path("community/", community, name="community"),
    path("settings/", settings_view, name="settings"),
    path("createpage/", createpage, name="createpage"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
