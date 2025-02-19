from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.models import User
from .models import UserProfile
from django.contrib import messages

# Create your views here.
def intro(request):
    return render(request, 'intro.html')

def about(request):
    return render(request, 'about.html')

@login_required
def mainpage(request):
    profile = UserProfile.objects.get(user=request.user)
    return render(request, 'mainpage.html', { 'profile': profile })

def getStarted(request):
    if request.method == 'POST':
        form_type = request.POST.get('form_type')

        if form_type == 'logout':
            logout(request)
            return redirect('getStarted')

        if form_type == 'login':

            username = request.POST.get('username', '')
            password = request.POST.get('password', '')

            if username and password:
                user = authenticate(request, username=username, password=password)
                if user is not None:
                    login(request, user)
                    return redirect('mainpage')
                else:
                    messages.error(request, "Invalid Credentials!")
            else:
                messages.error(request, "Username and Password are required!")

        elif form_type == 'register':
            username = request.POST.get('username', '')
            email = request.POST.get('email', '')
            password1 = request.POST.get('password1', '')
            password2 = request.POST.get('password2', '')

            if username and email and password1 and password2:
                if password1 == password2:
                    if not User.objects.filter(username=username).exists():
                        user = User.objects.create_user(username=username, email=email, password=password1)
                        user.save()
                        UserProfile.objects.create(user=user)
                        messages.success(request, "Registration successful! Please log in.")
                    else:
                        messages.error(request, "Username already exists!")
                else:
                    messages.error(request, "Passwords do not match!")
            else:
                messages.error(request, "All fields are required!")

    return render(request, 'getStarted.html')

def home(request):
    return render(request, "partials/home.html")

def my_projects(request):
    return render(request, "partials/my-projects.html")

def templates(request):
    return render(request, "partials/templates.html")

def community(request):
    return render(request, "partials/community.html")

@login_required
def settings_view(request):

    try:
        profile = UserProfile.objects.get(user=request.user)
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)

    success_message = None

    if request.method == "POST":
        bio = request.POST.get('bio', '').strip()

        profile.bio = bio

        if "profile_picture" in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']

        current_password = request.POST.get("current_password")
        new_password = request.POST.get("new_password")
        if current_password and new_password:
            if not check_password(current_password, request.user.password):
                return render(request, "mainpage.html", {"profile": profile, "error": "Current password is incorrect."})

            request.user.set_password(new_password)
            request.user.save()
            update_session_auth_hash(request, request.user)
            success_message = "Password changed successfully."

        profile.save()

        return render(request, "mainpage.html", {"profile": profile, "success": success_message})

    return render(request, "partials/settings.html", {'profile': profile})


def createpage(request):
    profile = UserProfile.objects.get(user=request.user)
    if request.user.is_authenticated:
        username = request.user.username
    else:
        username = None
    return render(request, "createpage.html", {'username': username, 'profile': profile})