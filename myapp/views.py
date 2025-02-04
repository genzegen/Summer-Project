from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.contrib import messages

# Create your views here.
def intro(request):
    return render(request, 'intro.html')

def about(request):
    return render(request, 'about.html')

def mainpage(request):
    return render(request, 'mainpage.html')

def getStarted(request):
    if request.method == 'POST':
        form_type = request.POST.get('form_type')

        if form_type == 'login':

            username = request.POST.get('username', '')
            password = request.POST.get('password', '')

            if username and password:
                user = authenticate(request, username=username, password=password)
                if user is not None:
                    login(request, user)
                    return redirect('mainpage')
                else:
                    messages.error(request, "Invalid Username or Password!")
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

def settings(request):
    return render(request, "partials/settings.html")

def createpage(request):
    return render(request, "createpage.html")