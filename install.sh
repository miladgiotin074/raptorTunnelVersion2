#!/bin/bash

APP_NAME="raptor-tunnel"
REPO_URL="https://github.com/miladgiotin074/raptorTunnelVersion2.git"
APP_DIR="/opt/$APP_NAME"
DASHBOARD_DIR="$APP_DIR/dashboard"
SERVICE_FILE="/etc/systemd/system/$APP_NAME.service"

RED="\033[1;31m"
GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RESET="\033[0m"

function banner() {
    clear
    figlet -f slant "Raptor Tunnel" | lolcat
    echo -e "${CYAN}============================================${RESET}"
    echo -e "${YELLOW}         🚀 Next.js Deployment Tool 🚀${RESET}"
    echo -e "${CYAN}============================================${RESET}"
}

function update_system() {
    echo -e "${YELLOW}[*] Updating system...${RESET}"
    apt update -y && apt upgrade -y
}

function install_deps() {
    echo -e "${YELLOW}[*] Installing dependencies...${RESET}"
    apt install -y curl git build-essential figlet lolcat
    bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
}

function clone_project() {
    echo -e "${YELLOW}[*] Cloning project...${RESET}"
    rm -rf $APP_DIR
    git clone $REPO_URL $APP_DIR
    cd $DASHBOARD_DIR || exit
    npm install
    npm run build
}

function create_service() {
    echo -e "${YELLOW}[*] Creating systemd service...${RESET}"
    cat > $SERVICE_FILE <<EOF
[Unit]
Description=Raptor Tunnel Next.js App
After=network.target

[Service]
Type=simple
WorkingDirectory=$DASHBOARD_DIR
ExecStart=/usr/bin/npm start
Restart=always
User=root
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload
    systemctl enable $APP_NAME
}

function start_app() {
    systemctl start $APP_NAME
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo -e "${GREEN}[+] App started successfully!${RESET}"
    echo -e "${CYAN}👉 Open: http://$SERVER_IP:3000 ${RESET}" | lolcat
}

function stop_app() {
    systemctl stop $APP_NAME
    echo -e "${RED}[-] App stopped.${RESET}"
}

function remove_app() {
    stop_app
    systemctl disable $APP_NAME
    rm -f $SERVICE_FILE
    systemctl daemon-reload
    rm -rf $APP_DIR
    echo -e "${RED}[x] App removed completely.${RESET}"
}

function menu() {
    banner
    echo -e "${YELLOW}1) Install & Setup${RESET}"
    echo -e "${YELLOW}2) Start App${RESET}"
    echo -e "${YELLOW}3) Stop App${RESET}"
    echo -e "${YELLOW}4) Remove App${RESET}"
    echo -e "${YELLOW}0) Exit${RESET}"
    read -rp "Choose an option: " choice

    case $choice in
        1) update_system; install_deps; clone_project; create_service; start_app ;;
        2) start_app ;;
        3) stop_app ;;
        4) remove_app ;;
        0) exit 0 ;;
        *) echo -e "${RED}Invalid choice!${RESET}" ;;
    esac
}

while true; do
    menu
    read -rp "Press Enter to continue..."
done
