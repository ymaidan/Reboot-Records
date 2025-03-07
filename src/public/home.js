import { gql } from '@apollo/client';
import client from '../utils/apolloClient.js';
import { GET_USER_INFO, GET_USER_LATEST_PROJECT, GET_USER_POSITION, GET_USER_XP_HISTORY, GET_USER_SKILLS ,GET_USER_AUDITS} from '../graphql/queries.js';
import { createProfileHeader } from '../utils/graphs.js'; // Import the function
import { checkAuth as validateAuth } from '../public/logout.js';

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
    console.log('JWT Token:', token);

    if (!token || token.startsWith('"') || token.endsWith('"')) {
        console.error('Invalid JWT token found. User is not authenticated.');
        return;
    }

    try {
        const { data } = await client.query({
            query: GET_USER_INFO,
            context: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });

        console.log('User data received:', data);

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

        // Check if image ID exists and format it properly
        const imageId = user.attrs && user.attrs["pro-picUploadId"] ? 
            user.attrs["pro-picUploadId"] : null;
        
        // Create proper image URL only if there's a valid imageId
        const imageUrl = imageId ? 
            `https://learn.reboot01.com/api/storage?token=${encodeURIComponent(token)}&fileId=${encodeURIComponent(imageId)}` : 
            null;

        const userData = {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            auditRatio: user.auditRatio,
            totalUp: user.totalUp || 0,
            totalDown: user.totalDown || 0,
            campus: user.public.campus,
            level: levelExists ? level : 'N/A',
            xp: user.transactions_aggregate.aggregate.sum.amount || 0,
            cohort: user.labels.find(label => label.labelName.startsWith('Cohort'))?.labelName || 'N/A',
            latestProject: user.events[0]?.event.path.split('/').pop() || 'N/A',
            imageUrl: imageUrl // Use the properly constructed URL
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

        console.log("Profile Image URL:", userData.imageUrl); // Log the profile image URL

        updateProfileHeader(userData);
        if (userData.imageUrl) {
            await updateProfileImage(userData.imageUrl);
        } else {
            console.log('No profile image available');
            // You might want to display a placeholder image here
        }
        
        drawAuditRatioGraph(userData);

    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Function to format XP
function formatXP(xp) {
    if (xp >= 1000) {
        return `${(xp / 1000).toFixed(0)} KB`;
    }
    return `${xp} KB`;
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
    document.getElementById('xpPlc').textContent = formatXP(userData.xp); // Use the formatXP function
    document.getElementById('cohortPlc').textContent = userData.cohort || 'N/A';
    document.getElementById('latestProjPlc').textContent = userData.latestProject || 'N/A';

    const imgContainer = document.getElementById('imgContainer');
    if (imgContainer) {
        imgContainer.innerHTML = ''; // Clear any existing content
        if (userData.imageUrl) {
            const img = document.createElement("img");
            img.src = userData.imageUrl;
            img.alt = "Personal Image";
            img.style.width = '100%'; // Ensure the image fits the container
            img.style.borderRadius = '50%'; // Make the image circular
            imgContainer.appendChild(img);
        } else {
            console.error('Image URL missing.');
        }
    } else {
        console.error('Image container not found.');
    }
}

// Update the profile image
async function updateProfileImage(imageUrl) {
    const imgContainer = document.getElementById('imgContainer');
    if (!imgContainer) return;
    
    // Clear existing content
    imgContainer.innerHTML = '';
    
    if (!imageUrl) {
        console.error('No image URL provided');
        // You could add a placeholder here
        return;
    }
    
    // Create image element
    const img = document.createElement("img");
    img.alt = "Profile Image";
    img.style.width = "100%"; 
    img.style.height = "100%"; 
    img.style.objectFit = "cover";
    
    // Add error handling
    img.onerror = function() {
        console.error('Failed to load image:', imageUrl);
        // You could set a placeholder image here
        this.src = '/src/assets/placeholder.png'; // Make sure this path exists
        this.onerror = null; // Prevent infinite error loop
    };
    
    // Set the source after adding error handler
    img.src = imageUrl;
    
    // Append to container
    imgContainer.appendChild(img);
    
    console.log('Image element added with URL:', imageUrl);
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

        FillProgressGraph(transactions); // Use the new function
    } catch (error) {
        console.error('Error fetching XP progress:', error);
    }
}

function FillProgressGraph(progressInfo) {
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

    //Cumulative XP Calculation
    let cumulativeXP = 0;
    const cumulativeData = progressInfo.map((point) => ({
        createdAt: new Date(point.createdAt),
        amount: (cumulativeXP += point.amount),
        projectName: point.object.name,
    }));

    //Extracting Dates: and xp max and min
    const dates = progressInfo.map((p) => new Date(p.createdAt).getTime());
    const xMin = new Date(Math.min(...dates));
    const xMax = new Date(Math.max(...dates));
    const yMin = 0;
    const yMax = Math.max(...cumulativeData.map((p) => p.amount));
    
    //Drawing the Axes
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

    //Adding Y-Axis Labels and Grid Lines
    for (let i = 0; i <= 5; i++) {
        const y = height + padding - (i * height) / 5;
        const value = Math.round((yMax * i) / 5);
        const label = document.createElementNS(svgNS, "text");
        label.setAttribute("x", padding - 10);
        label.setAttribute("y", y);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("fill", "#ffffff");
        label.setAttribute("class", "axis-label");
        label.textContent = formatXP(value);
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

    //Adding X-Axis Date Labels
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
    //Plotting Data Points
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

        //A circle element is created for each data point
        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", x);
        dot.setAttribute("cy", y);
        dot.setAttribute("r", 10);
        dot.setAttribute("class", "xp-dot animate-dot");
        dot.style.animationDelay = `${index * 0.01}s`;

        dot.addEventListener("mouseover", (e) => {
            const tooltip = document.createElementNS(svgNS, "text");
            tooltip.setAttribute("x", x);
            tooltip.setAttribute("y", y - 20);
            tooltip.setAttribute("text-anchor", "middle");
            tooltip.setAttribute("class", "tooltip");
            tooltip.textContent = formatXP(point.amount);
            svg.appendChild(tooltip);

            const tooltip2 = document.createElementNS(svgNS, "text");
            tooltip2.setAttribute("x", x);
            tooltip2.setAttribute("y", y - 5);
            tooltip2.setAttribute("text-anchor", "middle");
            tooltip2.setAttribute("class", "tooltip2");
            tooltip2.textContent = point.projectName;
            svg.appendChild(tooltip2);
        });
        //Removing Tooltips event
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

// Fetch skills data
async function fetchSkills() {
    try {
        const result = await client.query({
            query: GET_USER_SKILLS,
            variables: {
                userId: localStorage.getItem("userId"),
            },
        });
        console.log('Skills Data:', result.data); // Debugging: Log the entire data object
        FillSkillsGraph(result.data.user.transactions);
    } catch (error) {
        console.error('Error fetching skills:', error);
    }
}

function FillSkillsGraph(skillsInfo) {
    console.log('Skills Info:', skillsInfo); // Debugging: Log the skills info
    const technicalSkills = document.getElementById("technicalSkillsGraph");
    const technologySkills = document.getElementById("technologySkillsGraph");

    // Define categories based on your desired layout
    const technical = [
        "skill_prog", "skill_algo", "skill_sys-admin", "skill_front-end",
        "skill_back-end", "skill_game", "skill_tcp"
        ]; // Technical skills
        const technologies = [
        "skill_go", "skill_js", "skill_html", "skill_css",
        "skill_unix", "skill_docker", "skill_sql"
        ]; //

    // Separate transactions into categories
    const technicalTransactions = skillsInfo.filter((t) =>
        technical.includes(t.type)
    );
    const technologyTransactions = skillsInfo.filter((t) =>
        technologies.includes(t.type)
    );

    if (!technicalTransactions.length && !technologyTransactions.length) {
        console.error("No skills info found!");
        return;
    }

    // Sort technical transactions based on the order in the technical array
    const sortedTechnicalTransactions = technical.map(skill => 
        technicalTransactions.find(t => t.type === skill)
    ).filter(Boolean); // Filter out any undefined values

    if (sortedTechnicalTransactions.length) {
        drawSkillsChart(sortedTechnicalTransactions, technicalSkills, "Technical Skills");
    }

    // Sort technology transactions based on the order in the technologies array
    const sortedTechnologyTransactions = technologies.map(skill => 
        technologyTransactions.find(t => t.type === skill)
    ).filter(Boolean); // Filter out any undefined values

    if (sortedTechnologyTransactions.length) {
        drawSkillsChart(sortedTechnologyTransactions, technologySkills, "Technology Skills");
    }
}

function drawSkillsChart(transactions, targetContainer) {
    const pointCount = transactions.length;
    if (pointCount === 0) return;

    const maxValue = 100;
    const centerX = 150, centerY = 150, chartRadius = 100;
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.setAttribute("viewBox", "0 0 300 300");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // Draw background circles
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].forEach((scale) => {
        const circle = document.createElementNS(svgNamespace, "circle");
        circle.setAttribute("cx", centerX);
        circle.setAttribute("cy", centerY);
        circle.setAttribute("r", chartRadius * scale);
        circle.setAttribute("class", "radar-circle");
        svg.appendChild(circle);
    });

    // Draw axes and labels
    transactions.forEach((point, idx) => {
        const angle = (idx / pointCount) * (2 * Math.PI) - Math.PI / 2;
        const endX = centerX + chartRadius * Math.cos(angle);
        const endY = centerY + chartRadius * Math.sin(angle);

        // Draw axis line
        const axisLine = document.createElementNS(svgNamespace, "line");
        axisLine.setAttribute("x1", centerX);
        axisLine.setAttribute("y1", centerY);
        axisLine.setAttribute("x2", endX);
        axisLine.setAttribute("y2", endY);
        axisLine.setAttribute("class", "radar-axis");
        svg.appendChild(axisLine);

        // Create skill label
        const labelOffset = chartRadius + 20;
        const labelX = centerX + labelOffset * Math.cos(angle);
        const labelY = centerY + labelOffset * Math.sin(angle);
        const skillLabel = point.type.replace("skill_", "").replace("-", " ");
        const labelText = document.createElementNS(svgNamespace, "text");
        labelText.setAttribute("x", labelX);
        labelText.setAttribute("y", labelY);
        labelText.setAttribute("class", "skill-label");
        labelText.setAttribute("text-anchor", "middle");
        labelText.textContent = skillLabel;
        svg.appendChild(labelText);
    });

    // Draw data polygon
    const polygonPoints = transactions.map((point, idx) => {
        const angle = (idx / pointCount) * (2 * Math.PI) - Math.PI / 2;
        const value = (point.amount / maxValue) * chartRadius;
        return `${centerX + value * Math.cos(angle)},${centerY + value * Math.sin(angle)}`;
    }).join(" ");

    const radarPolygon = document.createElementNS(svgNamespace, "polygon");
    radarPolygon.setAttribute("points", polygonPoints);
    radarPolygon.setAttribute("class", "radar-area");
    svg.appendChild(radarPolygon);

    // Render the chart
    targetContainer.innerHTML = "";
    targetContainer.appendChild(svg);
}

async function audits() {
    try {
        const result = await client.query({
            query: GET_USER_AUDITS,
            variables: {
                userId: localStorage.getItem("userId"),
            },
        });
        console.log('Fetched audits:', result.data.user); // Debugging: Log the fetched audits
        return result.data.user[0];
    } catch (error) {
        console.error('Error fetching audits:', error);
    }
}


function auditsFiller(auditsInfo) {
	const usrAudits = document.getElementById("usrAudits");
	const passed = document.getElementById("passedPlc");
	const failed = document.getElementById("failedPlc");

	if (usrAudits && auditsInfo) {
		// Handle passed audits
		if (passed && Array.isArray(auditsInfo.passed)) {
			if (auditsInfo.passed.length === 0) {
				const noAudits = document.createElement("div");
				noAudits.className = "audit-card";
				noAudits.innerHTML =
					'<div class="audit-info"><div class="no-audits">No Passing Audits Yet!</div></div>';
				passed.appendChild(noAudits);
			} else {
				auditsInfo.passed.forEach((audit) => {
					const auditCard = document.createElement("div");
					auditCard.className = "audit-card";

					const auditInfo = document.createElement("div");
					auditInfo.className = "audit-info";

					const groupLeader = document.createElement("div");
					groupLeader.className = "group-leader";
					groupLeader.innerHTML = `<span class="label">Group Leader:</span> ${audit.group.captainLogin}`;

					const projectName = document.createElement("div");
					projectName.className = "project-name";
					projectName.innerHTML = `<span class="label">Project:</span> ${audit.group.path.replace(
						"/bahrain/bh-module/",
						""
					)}`;

					auditInfo.appendChild(groupLeader);
					auditInfo.appendChild(projectName);
					auditCard.appendChild(auditInfo);

					passed.appendChild(auditCard);
				});
			}
		}

		if (failed && Array.isArray(auditsInfo.failed)) {
			if (auditsInfo.failed.length === 0) {
				const noAudits = document.createElement("div");
				noAudits.className = "audit-card";
				noAudits.innerHTML =
					'<div class="audit-info"><div class="no-audits">No Failing Audits Yet!</div></div>';
				failed.appendChild(noAudits);
			} else {
				auditsInfo.failed.forEach((audit) => {
					const auditCard = document.createElement("div");
					auditCard.className = "audit-card";

					const auditInfo = document.createElement("div");
					auditInfo.className = "audit-info";

					const groupLeader = document.createElement("div");
					groupLeader.className = "group-leader";
					groupLeader.innerHTML = `<span class="label">Group Leader:</span> ${audit.group.captainLogin}`;

					const projectName = document.createElement("div");
					projectName.className = "project-name";
					projectName.innerHTML = `<span class="label">Project:</span> ${audit.group.path.replace(
						"/bahrain/bh-module/",
						""
					)}`;

					auditInfo.appendChild(groupLeader);
					auditInfo.appendChild(projectName);
					auditCard.appendChild(auditInfo);
					failed.appendChild(auditCard);
				});
			}
		}
	}
}
		
function drawAuditRatioGraph(userData) {
    const container = document.getElementById('auditGraphContainer');
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    // Clear the container
    container.innerHTML = '';

    // Create wrapper
    const auditWrapper = document.createElement('div');
    auditWrapper.className = 'audit-wrapper';
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Audits ratio';
    title.className = 'audit-title';
    auditWrapper.appendChild(title);

    // Create "Done" section
    const doneSection = document.createElement('div');
    doneSection.className = 'audit-row';
    
    const doneLabel = document.createElement('div');
    doneLabel.className = 'audit-label';
    doneLabel.textContent = 'Done';
    doneSection.appendChild(doneLabel);
    
    const doneBarContainer = document.createElement('div');
    doneBarContainer.className = 'audit-bar-container';
    
    const doneBar = document.createElement('div');
    doneBar.className = 'audit-bar done-bar';
    doneBarContainer.appendChild(doneBar);
    doneSection.appendChild(doneBarContainer);
    
    const doneValue = document.createElement('div');
    doneValue.className = 'audit-value';
    
    // Format the done value - simplify to just show MB
    const doneAmount = userData.totalUp || 0;
    // Convert to MB with 2 decimal places
    const doneMB = (doneAmount / 1000).toFixed(2);
    
    doneValue.innerHTML = `${doneMB} MB <span class="arrow-up">↑</span>`;
    doneSection.appendChild(doneValue);
    
    // Create "Received" section
    const receivedSection = document.createElement('div');
    receivedSection.className = 'audit-row';
    
    const receivedLabel = document.createElement('div');
    receivedLabel.className = 'audit-label';
    receivedLabel.textContent = 'Received';
    receivedSection.appendChild(receivedLabel);
    
    const receivedBarContainer = document.createElement('div');
    receivedBarContainer.className = 'audit-bar-container';
    
    const receivedBar = document.createElement('div');
    receivedBar.className = 'audit-bar received-bar';
    receivedBarContainer.appendChild(receivedBar);
    receivedSection.appendChild(receivedBarContainer);
    
    const receivedValue = document.createElement('div');
    receivedValue.className = 'audit-value';
    
    // Format the received value - simplify to just show MB
    const receivedAmount = userData.totalDown || 0;
    // Convert to MB with 2 decimal places
    const receivedMB = (receivedAmount / 1000).toFixed(2);
    
    receivedValue.innerHTML = `${receivedMB} MB <span class="arrow-down">↓</span>`;
    receivedSection.appendChild(receivedValue);
    
    // Create ratio display
    const ratioSection = document.createElement('div');
    ratioSection.className = 'ratio-section';
    
    // Calculate ratio with more precision
    const ratio = receivedAmount > 0 ? doneAmount / receivedAmount : 0;
    
    const ratioValue = document.createElement('div');
    ratioValue.className = 'ratio-value';
    ratioValue.textContent = ratio.toFixed(1);
    
    const ratioMessage = document.createElement('div');
    ratioMessage.className = 'ratio-message';
    ratioMessage.textContent = 'You can do better!';
    
    ratioSection.appendChild(ratioValue);
    ratioSection.appendChild(ratioMessage);
    
    // Set bar widths based on values
    const maxAmount = Math.max(doneAmount, receivedAmount);
    if (maxAmount > 0) {
        const doneWidth = (doneAmount / maxAmount) * 100;
        const receivedWidth = (receivedAmount / maxAmount) * 100;
        
        doneBar.style.width = `${doneWidth}%`;
        receivedBar.style.width = `${receivedWidth}%`;
    }
    
    // Assemble everything
    auditWrapper.appendChild(doneSection);
    auditWrapper.appendChild(receivedSection);
    auditWrapper.appendChild(ratioSection);
    
    container.appendChild(auditWrapper);
}

async function fetchAuditRatio() {
    const jwt = localStorage.getItem('jwt_token');
    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${jwt}` 
            },
            body: JSON.stringify({
                query: `{ user { auditRatio totalUp totalDown } }`
            })
        });
        const data = await response.json();
        console.log('Audit Ratio Response:', data);

        if (data.data && Array.isArray(data.data.user) && data.data.user.length > 0) {
            const user = data.data.user[0];
            const userData = {
                totalUp: user.totalUp || 0,
                totalDown: user.totalDown || 0
            };
            drawAuditRatioGraph(userData);
            return userData;
        } else {
            console.error('No data available');
            return null;
        }
    } catch (error) {
        console.error('Error fetching audit ratio:', error);
        return null;
    }
}

// Function to load user profile image
function loadUserProfileImage(imageUrl) {
    const imgContainer = document.getElementById('imgContainer');
    if (!imgContainer) return;
    
    // Clear existing content
    imgContainer.innerHTML = '';
    
    // Create image element
    const img = document.createElement('img');
    img.alt = 'User Profile';
    
    // Handle image loading or fallback to placeholder
    if (imageUrl) {
        img.src = imageUrl;
        img.onerror = function() {
            // If image fails to load, use placeholder
            this.src = '/src/assets/placeholder.png';
            console.log('Failed to load user image, using placeholder');
        };
    } else {
        // No image URL provided, use placeholder
        img.src = '/src/assets/placeholder.png';
    }
    
    // Append image to container
    imgContainer.appendChild(img);
    console.log('User image loaded:', imageUrl || 'placeholder');
}

// Add this function to your home.js file
function setupThemeListener() {
    // Listen for theme changes
    document.addEventListener('themeChanged', (event) => {
        const theme = event.detail; // 'light' or 'dark'
        console.log(`Theme changed to ${theme}, updating graphs...`);
        
        // Redraw charts that need theme-specific updates
        updateChartsForTheme(theme);
    });
}

function updateChartsForTheme(theme) {
    // This function will redraw any charts that need theme-specific updates
    
    // If you have Chart.js instances stored in variables, update their options:
    if (window.xpChart) {
        window.xpChart.options.scales.x.grid.color = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        window.xpChart.options.scales.y.grid.color = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        window.xpChart.options.scales.x.ticks.color = theme === 'light' ? '#334155' : '#ffffff';
        window.xpChart.options.scales.y.ticks.color = theme === 'light' ? '#334155' : '#ffffff';
        window.xpChart.update();
    }
    
    // For D3 graphs, you might need to reapply styles:
    if (document.querySelector('#technicalSkillsGraph svg')) {
        const textColor = theme === 'light' ? '#334155' : '#ffffff';
        d3.selectAll('#technicalSkillsGraph svg text').style('fill', textColor);
        d3.selectAll('#technicalSkillsGraph svg line').style('stroke', theme === 'light' ? '#64748b' : '#b8b8b8');
    }
    
    if (document.querySelector('#technologySkillsGraph svg')) {
        const textColor = theme === 'light' ? '#334155' : '#ffffff';
        d3.selectAll('#technologySkillsGraph svg text').style('fill', textColor);
        d3.selectAll('#technologySkillsGraph svg line').style('stroke', theme === 'light' ? '#64748b' : '#b8b8b8');
    }
    
    // Redraw the audit ratio graph
    const userData = window.lastUserData;
    if (userData && userData.totalUp !== undefined && userData.totalDown !== undefined) {
        drawAuditRatioGraph(userData);
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    handleAuth();
    await fetchUserData();
    await fetchXPProgress();
    await fetchSkills();
    
    // Fetch and display audit ratio
    await fetchAuditRatio();
    
    // Fetch and fill audits data
    const auditsInfo = await audits();
    auditsFiller(auditsInfo);
    
    // Set up theme change listener
    setupThemeListener();
    
    // Store user data for potential redraws
    const auditData = await fetchAuditRatio();
    if (auditData) {
        window.lastUserData = auditData;
    }
});
