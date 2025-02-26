import { gql } from '@apollo/client';
import client from '../utils/apolloClient.js';
import { numberWithOrdinal } from '../utils/numbersFormatter.js';
import { GET_USER_INFO, GET_USER_LATEST_PROJECT, GET_USER_POSITION, GET_USER_XP_HISTORY } from '../graphql/queries.js';
import { createProfileHeader } from '../utils/graphs.js'; // Import the function
import { checkAuth as validateAuth } from '/src/public/logout.js';

// Check if user is authenticated
function handleAuth() {
    const token = localStorage.getItem('jwt_token');
    console.log('JWT Token:', token); // Log the token to check its format
    if (!token) {
        window.location.href = '/index.html';
    }
}

// Fetch user data using Apollo Client
async function fetchUserData() {
    const token = localStorage.getItem('jwt_token');
    console.log('JWT Token:', token); // Log the token to check its format

    // Check if the token is valid (not null or empty)
    if (!token || token.startsWith('"') || token.endsWith('"')) {
        console.error('Invalid JWT token found. User is not authenticated.');
        return; // Exit if no valid token is found
    }

    try {
        const { data } = await client.query({
            query: GET_USER_INFO,
            context: {
                headers: {
                    Authorization: `Bearer ${token}`, // Ensure the token is sent correctly
                },
            },
        });

        console.log('User data received:', data); // Log the received data

        // Check if user data is present
        if (!data || !data.user || !data.user.length) {
            throw new Error('No user data received');
        }

        const user = data.user[0];
        let levelExists = false;
        let level = 'N/A';

        console.log('User events:', user.events);

        user.events.forEach((theEvent) => {
            if (theEvent.event.path === "/bahrain/bh-module") {
                level = theEvent.level;
                levelExists = true;
            }
        });

        // Store user ID in localStorage
        localStorage.setItem('userId', user.id);

        const userData = {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            auditRatio: user.auditRatio,
            campus: user.public.campus,
            level: levelExists ? level : 'N/A',
            xp: user.transactions_aggregate.aggregate.sum.amount || 0,
            cohort: user.labels.find(label => label.labelName.startsWith('Cohort'))?.labelName || 'N/A',
            latestProject: user.events[0]?.event.path.split('/').pop() || 'N/A',
            imageId: user.attrs["pro-picUploadId"]
        };

        // Fetch the latest project
        const latestProjVal = await client.query({
            query: GET_USER_LATEST_PROJECT,
            variables: {
                userID: user.id,
            },
        }).then((result) => {
            console.log("Latest Project Query Result:", result); // Log the result
            return result.data.group[0]?.object?.name || "Nothing For Now!";
        });

        userData.latestProject = latestProjVal; // Add latest project to userData

        console.log("Profile Image URL:", userData.imageId); // Log the profile image URL

        updateProfileHeader(userData);
        await updateProfileImage(userData.imageId);
        
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Update the profile header with user data
function updateProfileHeader(userData) {
    // Ensure userData is valid before updating the UI
    if (!userData) {
        console.error('No user data available to update the profile header.');
        return;
    }
    
    document.getElementById('namePlc').textContent = userData.name || 'N/A';
    document.getElementById('emailPlc').textContent = userData.email || 'N/A';
    document.getElementById('auditRatioPlc').textContent = userData.auditRatio?.toFixed(2) || 'N/A';
    document.getElementById('campusPlc').textContent = userData.campus || 'N/A';
    document.getElementById('levelPlc').textContent = userData.level || 'N/A';
    document.getElementById('xpPlc').textContent = `${userData.xp} KB`;
    document.getElementById('cohortPlc').textContent = userData.cohort || 'N/A';
    document.getElementById('rankPlc').textContent = 'N/A'; // Set rank to N/A if not used
    document.getElementById('latestProjPlc').textContent = userData.latestProject || 'N/A';

    const imgContainer = document.getElementById('imgContainer');
    if (imgContainer) {
        imgContainer.innerHTML = ''; // Clear any existing content
        if (userData.imageId) {
            const img = document.createElement("img");
            img.src = `https://learn.reboot01.com/api/storage?token=${localStorage.getItem("jwt_token")}&fileId=${userData.imageId}`;
            img.alt = "Personal Image";
            img.style.width = '100%'; // Ensure the image fits the container
            img.style.borderRadius = '50%'; // Make the image circular
            imgContainer.appendChild(img);
        } else {
            console.error('Image ID missing.');
        }
    } else {
        console.error('Image container not found.');
    }
}

async function fetchUserRank() {
    try {
        const userID = localStorage.getItem("userId");
        if (!userID) {
            console.error('User ID not found in localStorage');
            return;
        }

        const { data } = await client.query({
            query: GET_USER_POSITION,
            variables: { userID: parseInt(userID) },
        });

        console.log('Rank data received:', data);

        const position = data.event[0]?.registrations[0]?.users[0]?.position;
        const rankNo = numberWithOrdinal(position);

        if (rankNo !== "Invalid Number") {
            document.getElementById('rankPlc').textContent = `${rankNo} Among All Students`;
        } else {
            document.getElementById('rankPlc').textContent = "N/A";
        }
    } catch (error) {
        console.error('Error fetching user rank:', error);
        document.getElementById('rankPlc').textContent = "N/A";
    }
}

// Update the profile image
async function updateProfileImage(imageUrl) {
    const imgContainer = document.getElementById('imgContainer');
    if (imgContainer) {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = "Profile Image";
        img.style.width = "100%"; // Ensure it fills the container
        img.style.height = "100%"; // Ensure it fills the container
        img.style.objectFit = "cover"; // Maintain aspect ratio
     
    }
}

async function fetchXPProgress() {
    try {
        const result = await client.query({
            query: GET_USER_XP_HISTORY,
            variables: {
                userId: localStorage.getItem("userId"),
            },
        });

        const transactions = result.data.transaction;
        console.log('XP Transactions:', transactions); // Log the transactions

        progressFiller(transactions); // Use the new function
    } catch (error) {
        console.error('Error fetching XP progress:', error);
    }
}

function progressFiller(progressInfo) {
    const XPOverTime = document.getElementById("XPOverTime");
    if (!XPOverTime || !progressInfo.length) return;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 800 400");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.overflow = "visible";
    const padding = 60;
    const width = 800 - 2 * padding;
    const height = 400 - 2 * padding;

    let cumulativeXP = 0;
    const cumulativeData = progressInfo.map((point) => ({
        createdAt: new Date(point.createdAt),
        amount: (cumulativeXP += point.amount),
        projectName: point.object.name,
    }));

    const dates = progressInfo.map((p) => new Date(p.createdAt).getTime());
    const xMin = new Date(Math.min(...dates));
    const xMax = new Date(Math.max(...dates));
    const yMin = 0;
    const yMax = Math.max(...cumulativeData.map((p) => p.amount));

    const xAxis = document.createElementNS(svgNS, "line");
    xAxis.setAttribute("x1", padding);
    xAxis.setAttribute("y1", height + padding);
    xAxis.setAttribute("x2", width + padding);
    xAxis.setAttribute("y2", height + padding);
    xAxis.setAttribute("stroke", "#ffffff");
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS(svgNS, "line");
    yAxis.setAttribute("x1", padding);
    yAxis.setAttribute("y1", padding);
    yAxis.setAttribute("x2", padding);
    yAxis.setAttribute("y2", height + padding);
    yAxis.setAttribute("stroke", "#ffffff");
    svg.appendChild(yAxis);

    for (let i = 0; i <= 5; i++) {
        const y = height + padding - (i * height) / 5;
        const value = Math.round((yMax * i) / 5);
        const label = document.createElementNS(svgNS, "text");
        label.setAttribute("x", padding - 10);
        label.setAttribute("y", y);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("fill", "#ffffff");
        label.setAttribute("class", "axis-label");
        label.textContent = value;
        svg.appendChild(label);

        const gridLine = document.createElementNS(svgNS, "line");
        gridLine.setAttribute("x1", padding);
        gridLine.setAttribute("y1", y);
        gridLine.setAttribute("x2", width + padding);
        gridLine.setAttribute("y2", y);
        gridLine.setAttribute("stroke", "rgba(255, 255, 255, 0.1)");
        gridLine.setAttribute("class", "grid-line");
        svg.appendChild(gridLine);
    }

    const numDateLabels = 5;
    for (let i = 0; i <= numDateLabels; i++) {
        const x = padding + (i * width) / numDateLabels;
        const date = new Date(xMin.getTime() + (xMax - xMin) * (i / numDateLabels));
        const label = document.createElementNS(svgNS, "text");
        label.setAttribute("x", x);
        label.setAttribute("y", height + padding + 20);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("fill", "#ffffff");
        label.setAttribute("class", "axis-label");
        label.textContent = date.toLocaleDateString();
        svg.appendChild(label);
    }

    cumulativeData.forEach((point, index) => {
        const x = padding + ((point.createdAt - xMin) / (xMax - xMin)) * width;
        const y = height + padding - ((point.amount - yMin) / (yMax - yMin)) * height;

        if (index > 0) {
            const prevPoint = cumulativeData[index - 1];
            const prevX = padding + ((prevPoint.createdAt - xMin) / (xMax - xMin)) * width;
            const prevY = height + padding - ((prevPoint.amount - yMin) / (yMax - yMin)) * height;
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", prevX);
            line.setAttribute("y1", prevY);
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
            line.setAttribute("stroke-width", "2");
            line.setAttribute("class", "xp-line animate-line");
            svg.appendChild(line);
        }

        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", x);
        dot.setAttribute("cy", y);
        dot.setAttribute("r", 4);
        dot.setAttribute("class", "xp-dot animate-dot");
        dot.style.animationDelay = `${index * 0.01}s`;

        dot.addEventListener("mouseover", (e) => {
            const tooltip = document.createElementNS(svgNS, "text");
            tooltip.setAttribute("x", x);
            tooltip.setAttribute("y", y - 20);
            tooltip.setAttribute("text-anchor", "middle");
            tooltip.setAttribute("class", "tooltip");
            tooltip.textContent = point.amount;
            svg.appendChild(tooltip);

            const tooltip2 = document.createElementNS(svgNS, "text");
            tooltip2.setAttribute("x", x);
            tooltip2.setAttribute("y", y - 5);
            tooltip2.setAttribute("text-anchor", "middle");
            tooltip2.setAttribute("class", "tooltip2");
            tooltip2.textContent = point.projectName;
            svg.appendChild(tooltip2);
        });

        dot.addEventListener("mouseout", () => {
            const tooltip = svg.querySelector(".tooltip");
            if (tooltip) tooltip.remove();
            const tooltip2 = svg.querySelector(".tooltip2");
            if (tooltip2) tooltip2.remove();
        });

        svg.appendChild(dot);
    });

    XPOverTime.innerHTML = "";
    XPOverTime.appendChild(svg);
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    handleAuth();
    fetchUserData().then(() => {
        fetchUserRank();
        fetchXPProgress(); // Fetch XP progress
    });
});
